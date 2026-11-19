import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Alert,
  BackHandler,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  eventLink,
  occurrenceDate,
  parseEventLink,
  productionOrigin,
} from "./eventLinks.mjs";

const origin = process.env.EXPO_PUBLIC_ZAYLIST_ORIGIN || productionOrigin;
async function api(path, method = "GET", body) {
  const response = await fetch(origin + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      data?.error || `Request failed (${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
function Button({ label, onPress, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[s.button, disabled && s.disabled]}
    >
      <Text style={s.buttonText}>{label}</Text>
    </Pressable>
  );
}
function Poster({ row }) {
  if (!row.posterImageUrl) return null;
  const uri = new URL(row.posterImageUrl, origin).href;
  return (
    <Image
      source={{ uri }}
      accessibilityIgnoresInvertColors
      style={s.poster}
      resizeMode="contain"
    />
  );
}

export default function App() {
  const [rows, setRows] = useState(null),
    [feedError, setFeedError] = useState("");
  const [selection, setSelection] = useState(null),
    [event, setEvent] = useState(null),
    [detailError, setDetailError] = useState("");
  const [filter, setFilter] = useState(""),
    [linkText, setLinkText] = useState("");
  const [viewer, setViewer] = useState(null),
    [authOpen, setAuthOpen] = useState(false),
    [username, setUserName] = useState(""),
    [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(""),
    [sessionReady, setSessionReady] = useState(false);
  const [privateState, setPrivateState] = useState(null),
    [memberError, setMemberError] = useState(""),
    [busy, setBusy] = useState(false);
  const authEpoch = useRef(0),
    detailEpoch = useRef(0),
    acting = useRef(false);
  const list = useRef(null),
    offset = useRef(0),
    selectedOffset = useRef(0);
  function resetMember(user) {
    authEpoch.current++;
    setPrivateState(null);
    setMemberError("");
    setViewer(user);
    setSessionReady(true);
  }
  async function memberData(user) {
    const epoch = authEpoch.current;
    try {
      const [saves, attendance] = await Promise.all([
        api("/api/events/mine/saved"),
        api("/api/events/mine/check-ins"),
      ]);
      if (epoch === authEpoch.current) {
        setPrivateState({ saves, attendance, userId: user.id });
        setMemberError("");
      }
    } catch (error) {
      if (epoch === authEpoch.current) {
        setPrivateState(null);
        setMemberError(error.message);
        if (error.status === 401) resetMember(null);
      }
    }
  }
  async function session() {
    const epoch = authEpoch.current;
    try {
      const me = await api("/api/auth/me");
      if (epoch === authEpoch.current) resetMember(me?.id ? me : null);
    } catch (e) {
      if (epoch !== authEpoch.current) return;
      resetMember(null);
      if (e.status !== 401) setAuthError(e.message);
    }
  }
  async function loadFeed() {
    setFeedError("");
    try {
      const data = await api("/api/events");
      if (!Array.isArray(data)) throw new Error("Unexpected event feed.");
      const today = occurrenceDate(new Date().toISOString());
      const upcoming = data.filter(
        (row) => occurrenceDate(row.dateEnd || row.dateStart) >= today,
      );
      upcoming.sort((a, b) => a.dateStart.localeCompare(b.dateStart));
      setRows(upcoming);
    } catch (e) {
      setFeedError(e.message);
    }
  }
  const open = useCallback((choice) => {
    selectedOffset.current = offset.current;
    setSelection(choice);
    setEvent(null);
    setDetailError("");
    const token = ++detailEpoch.current;
    api(
      `/api/events/${choice.id}` +
        (choice.date ? `?date=${encodeURIComponent(choice.date)}` : ""),
    )
      .then((row) => {
        if (token === detailEpoch.current) {
          if (choice.date && occurrenceDate(row.dateStart) !== choice.date)
            throw new Error("That event occurrence is unavailable.");
          setEvent(row);
        }
      })
      .catch((e) => {
        if (token === detailEpoch.current) setDetailError(e.message);
      });
  }, []);
  const close = useCallback(() => {
    detailEpoch.current++;
    setSelection(null);
    setDetailError("");
    setEvent(null);
    requestAnimationFrame(() =>
      list.current?.scrollToOffset({
        offset: selectedOffset.current,
        animated: false,
      }),
    );
  }, []);
  useEffect(() => {
    loadFeed();
    session();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") session();
    });
    const receive = (url) => {
      const choice = parseEventLink(url);
      if (choice) open(choice);
    };
    Linking.getInitialURL()
      .then((url) => {
        if (url) receive(url);
      })
      .catch(() => {});
    const sub = Linking.addEventListener("url", ({ url }) => receive(url));
    return () => {
      sub.remove();
      appState.remove();
    };
  }, [open]);
  useEffect(() => {
    if (viewer) memberData(viewer);
  }, [viewer]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (selection) {
        close();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [selection, close]);
  function cancelAuth() {
    setPassword("");
    setAuthError("");
    setAuthOpen(false);
  }
  async function signIn() {
    if (acting.current) return;
    acting.current = true;
    setBusy(true);
    setAuthError("");
    try {
      await api("/api/auth/login", "POST", {
        email: username.trim(),
        password,
      });
      const me = await api("/api/auth/me");
      if (!me?.id) throw new Error("The session was not established.");
      resetMember(me);
      cancelAuth();
    } catch (e) {
      setAuthError(e.message);
      setPassword("");
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }
  async function signOut() {
    if (acting.current) return;
    acting.current = true;
    setBusy(true);
    try {
      await api("/api/auth/logout", "POST");
      resetMember(null);
      setUserName("");
      setPassword("");
    } catch (e) {
      Alert.alert("Could not sign out", e.message);
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }
  async function change(kind, wasActive) {
    if (!event || !viewer || !privateState || acting.current) return;
    acting.current = true;
    setBusy(true);
    const owner = viewer,
      epoch = authEpoch.current;
    try {
      const suffix = kind === "save" ? "save" : "attendance";
      const method = wasActive ? "DELETE" : kind === "save" ? "PUT" : "POST";
      await api(
        `/api/events/${event.id}/${suffix}`,
        method,
        kind === "going" && !wasActive
          ? { message: "Going", visibility: "public" }
          : undefined,
      );
      if (epoch === authEpoch.current) await memberData(owner);
    } catch (e) {
      if (e.status === 401) resetMember(null);
      else if (epoch === authEpoch.current)
        Alert.alert("Could not update this event", e.message);
    } finally {
      acting.current = false;
      setBusy(false);
    }
  }
  function enterLink() {
    const choice = parseEventLink(linkText.trim());
    if (choice) {
      setLinkText("");
      open(choice);
    } else Alert.alert("Enter a Zaylist event link");
  }
  const ready = privateState && privateState.userId === viewer?.id;
  const saved = ready && event && privateState.saves.includes(event.id);
  const attendance =
    ready &&
    event &&
    privateState.attendance.find((a) => a.eventId === event.id);
  const expired =
    event &&
    occurrenceDate(event.dateEnd || event.dateStart) <
      occurrenceDate(new Date().toISOString());
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <View
          style={[s.root, selection && s.hidden]}
          accessibilityElementsHidden={!!selection}
          importantForAccessibility={selection ? "no-hide-descendants" : "auto"}
        >
          <FlatList
            ref={list}
            data={(rows || []).filter((row) =>
              (
                row.title +
                " " +
                row.venueName +
                " " +
                occurrenceDate(row.dateStart)
              )
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )}
            keyExtractor={(row) => String(row.id) + ":" + row.dateStart}
            onScroll={(e) => {
              offset.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={32}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={s.section}>
                <Text style={s.title}>Eventz</Text>
                <Button
                  disabled={!sessionReady || busy}
                  label={viewer ? `Sign out · ${viewer.username}` : "Sign in"}
                  onPress={viewer ? signOut : () => setAuthOpen(true)}
                />
                <TextInput
                  accessibilityLabel="Filter events"
                  placeholder="Event, venue or date"
                  placeholderTextColor="#a5a5ad"
                  style={s.input}
                  value={filter}
                  onChangeText={setFilter}
                />
                <TextInput
                  accessibilityLabel="Shared event link"
                  placeholder="Paste a shared event link"
                  placeholderTextColor="#a5a5ad"
                  style={s.input}
                  autoCapitalize="none"
                  value={linkText}
                  onChangeText={setLinkText}
                  onSubmitEditing={enterLink}
                />
                {linkText.length > 0 && (
                  <Button label="Open shared event" onPress={enterLink} />
                )}
                {feedError ? (
                  <>
                    <Text style={s.text}>{feedError}</Text>
                    <Button label="Retry events" onPress={loadFeed} />
                  </>
                ) : (
                  !rows && <ActivityIndicator />
                )}
              </View>
            }
            ListEmptyComponent={
              rows && !feedError ? (
                <Text style={s.text}>No matching events.</Text>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.title}
                style={s.card}
                onPress={() =>
                  open({ id: item.id, date: occurrenceDate(item.dateStart) })
                }
              >
                <Poster row={item} />
                <Text style={s.heading}>{item.title}</Text>
                <Text style={s.text}>
                  {occurrenceDate(item.dateStart)} · {item.venueName}
                </Text>
              </Pressable>
            )}
          />
        </View>
        {selection && (
          <ScrollView contentContainerStyle={s.section}>
            <Button label="Back to events" onPress={close} />
            {detailError ? (
              <>
                <Text style={s.text}>{detailError}</Text>
                <Button label="Retry event" onPress={() => open(selection)} />
              </>
            ) : !event ? (
              <ActivityIndicator />
            ) : (
              <>
                <Poster row={event} />
                <Text style={s.title}>{event.title}</Text>
                <Text style={s.text}>
                  {event.dateStart} · {event.venueName}
                </Text>
                {event.description && (
                  <Text style={s.text}>{event.description}</Text>
                )}
                <Button
                  label="Share event"
                  onPress={() =>
                    Share.share({
                      message: eventLink(
                        event.id,
                        occurrenceDate(event.dateStart),
                      ),
                    }).catch((e) => Alert.alert("Could not share", e.message))
                  }
                />
                {!viewer ? (
                  <Button
                    label="Sign in to save or mark Going"
                    onPress={() => setAuthOpen(true)}
                  />
                ) : memberError ? (
                  <>
                    <Text style={s.text}>{memberError}</Text>
                    <Button
                      label="Retry your event status"
                      onPress={() => memberData(viewer)}
                    />
                  </>
                ) : !ready ? (
                  <ActivityIndicator />
                ) : (
                  <>
                    <Button
                      label={saved ? "Remove private save" : "Save privately"}
                      disabled={busy}
                      onPress={() => change("save", saved)}
                    />
                    {attendance && (
                      <Text style={s.text}>
                        Going · {attendance.visibility || "public"}
                      </Text>
                    )}
                    <Button
                      label={
                        attendance
                          ? "Withdraw Going"
                          : expired
                            ? "Event has ended"
                            : "Mark Going publicly"
                      }
                      disabled={busy || (!attendance && expired)}
                      onPress={() => change("going", !!attendance)}
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>
        )}
        <Modal
          visible={authOpen}
          animationType="slide"
          onRequestClose={busy ? () => {} : cancelAuth}
        >
          <SafeAreaView style={s.root}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.section}
            >
              <Text style={s.title}>Sign in</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                placeholder="Email or username"
                placeholderTextColor="#a5a5ad"
                style={s.input}
                value={username}
                onChangeText={setUserName}
              />
              <TextInput
                secureTextEntry
                autoComplete="current-password"
                placeholder="Password"
                placeholderTextColor="#a5a5ad"
                style={s.input}
                value={password}
                onChangeText={setPassword}
              />
              {authError && (
                <Text accessibilityRole="alert" style={s.text}>
                  {authError}
                </Text>
              )}
              <Button
                label="Sign in"
                disabled={busy || !username.trim() || !password}
                onPress={signIn}
              />
              <Button label="Cancel" disabled={busy} onPress={cancelAuth} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111218" },
  hidden: { display: "none" },
  section: { padding: 18, gap: 12 },
  card: {
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 12,
    gap: 6,
    backgroundColor: "#20212a",
    borderRadius: 8,
  },
  poster: { height: 240, width: "100%" },
  title: { fontSize: 30, fontWeight: "800", color: "#fff" },
  heading: { fontSize: 20, fontWeight: "700", color: "#fff" },
  text: { fontSize: 16, color: "#e4e4e9" },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#767782",
    color: "#fff",
    padding: 10,
  },
  button: {
    minHeight: 46,
    padding: 10,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7bced5",
    borderRadius: 6,
  },
  buttonText: { fontSize: 16, color: "#c7f8fa", fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
