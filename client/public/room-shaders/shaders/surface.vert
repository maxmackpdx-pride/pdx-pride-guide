attribute vec2 position;
varying vec2 vScreen;
void main() {
  vScreen = vec2(position.x, -position.y) * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
