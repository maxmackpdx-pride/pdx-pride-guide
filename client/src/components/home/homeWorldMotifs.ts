/**
 * Per-card line objects for the world rail, ported from the World Cards design
 * project. Each card gets four or so drawings scattered across its face at low
 * opacity, sitting behind the content and in front of the full-bleed pattern.
 * They are the subject of the card stated as an object, not wallpaper.
 *
 * Every path is drawn in a 64x64 box with `vector-effect: non-scaling-stroke`,
 * so a 46px badge and a 210px ghost carry the same line weight. Colour comes
 * from `--c` on the card, so calm mode neutralises them with everything else.
 */

import type { WorldKey } from "@/lib/homeWorlds";

export type WorldMotif = {
  path: string;
  /** Percent of the card box. */
  top: string;
  left: string;
  size: string;
  opacity: number;
  rotate: string;
};

export const WORLD_MOTIFS: Partial<Record<WorldKey, WorldMotif[]>> = {
  placez: [
    { path: "M8 40 H56 M14 40 V26 M22 40 V20 M30 40 V16 M38 40 V20 M46 40 V26 M20 26 H24 M28 20 H32 M36 20 H40 M20 26 L24 20 M40 26 L36 20", top: "10%", left: "52%", size: "130px", opacity: 0.2, rotate: "-2deg" },
    { path: "M32 4v56M18 16c0-7 7-10 14-10s14 3 14 10-7 9-14 9-14 3-14 9 7 10 14 10 14-3 14-10", top: "28%", left: "26%", size: "210px", opacity: 0.08, rotate: "-6deg" },
    { path: "M32 12 C24 12 24 22 32 22 C24 22 22 32 32 32 C22 32 24 44 32 44 C40 44 38 32 32 32 C40 32 38 22 32 22 C40 22 40 12 32 12 Z", top: "45%", left: "6%", size: "58px", opacity: 0.16, rotate: "8deg" },
    { path: "M6 46 L20 22 L30 36 L38 18 L58 46 Z", top: "62%", left: "62%", size: "96px", opacity: 0.18, rotate: "-4deg" },
    { path: "M14 44 H50 V22 H14 Z M14 22 L32 10 L50 22 M24 44 V32 H40 V44", top: "4%", left: "8%", size: "44px", opacity: 0.22, rotate: "3deg" },
    { path: "M32 8 L44 30 L38 30 L48 46 H16 L26 30 L20 30 Z", top: "72%", left: "26%", size: "70px", opacity: 0.17, rotate: "2deg" },
    { path: "M18 46 V14 H46 V46 M18 20 H46 M18 28 H46 M18 36 H46 M22 14 V10 M30 14 V8 M38 14 V10", top: "55%", left: "78%", size: "54px", opacity: 0.2, rotate: "6deg" },
  ],
  hauz: [
    { path: "M14 46 H50 V22 H14 Z M14 22 L32 10 L50 22 M24 46 V32 H40 V46 M20 22 V16 H26 V22", top: "4%", left: "52%", size: "110px", opacity: 0.2, rotate: "-4deg" },
    { path: "M32 8 V56 M8 32 H56", top: "44%", left: "6%", size: "54px", opacity: 0.16, rotate: "45deg" },
    { path: "M8 44 V20 H36 V44 M8 32 H36 M8 20 L22 8 L36 20", top: "66%", left: "64%", size: "86px", opacity: 0.15, rotate: "3deg" },
    { path: "M16 48 C16 30 24 18 32 18 C40 18 48 30 48 48 Z M32 18 V6", top: "8%", left: "8%", size: "44px", opacity: 0.2, rotate: "-6deg" },
  ],
  giftz: [
    { path: "M14 42h30v14H14zM10 32h38v10H10zM29 42v14M22 32c-9-4-12-11-7-14 5-3 11 2 7 14zM29 32c9-4 12-11 7-14-5-3-11 2-7 14z", top: "6%", left: "54%", size: "110px", opacity: 0.2, rotate: "-6deg" },
    { path: "M12 36h24v18H12zM8 28h32v8H8zM24 36v18M18 28c-8-4-10-9-6-12 4-2 9 2 6 12zM24 28c8-4 10-9 6-12-4-2-9 2-6 12z", top: "46%", left: "6%", size: "64px", opacity: 0.16, rotate: "5deg" },
    { path: "M8 22h44l-6 30H14Z M8 22l4-8h36l4 8", top: "66%", left: "62%", size: "88px", opacity: 0.15, rotate: "4deg" },
    { path: "M32 4v56M20 14c0-6 6-9 12-9s12 3 12 9-6 8-12 8-12 2-12 8 6 9 12 9 12-3 12-9", top: "30%", left: "30%", size: "190px", opacity: 0.1, rotate: "-8deg" },
  ],
  gigz: [
    { path: "M8 16h48M8 16v10h48V16M14 26v8h14v-8M36 26v8h14v-8", top: "6%", left: "52%", size: "110px", opacity: 0.2, rotate: "-4deg" },
    { path: "M16 8v48M16 20l-8 6 8 6M16 32l8 6-8 6", top: "46%", left: "6%", size: "58px", opacity: 0.16, rotate: "3deg" },
    { path: "M10 44l10-28 10 28M14 34h12M32 44V16h10a8 8 0 1 1 0 16h-10", top: "66%", left: "64%", size: "80px", opacity: 0.15, rotate: "-3deg" },
    { path: "M32 6a26 26 0 1 0 .01 0Z M22 26h8v8h-8zM34 30h8v8h-8zM22 42h20", top: "32%", left: "28%", size: "180px", opacity: 0.09, rotate: "6deg" },
  ],
  sellz: [
    { path: "M32 8v10M20 18h24l-3 34H23Z M26 18l1-6h10l1 6", top: "4%", left: "56%", size: "108px", opacity: 0.2, rotate: "-6deg" },
    { path: "M8 32h48M14 32l8-8M14 32l8 8M50 32l-8-8M50 32l-8 8", top: "48%", left: "6%", size: "60px", opacity: 0.16, rotate: "4deg" },
    { path: "M12 48V20l20-12 20 12v28Z M32 8v10", top: "68%", left: "62%", size: "82px", opacity: 0.15, rotate: "3deg" },
    { path: "M32 4v56M20 14c0-6 6-9 12-9s12 3 12 9-6 8-12 8-12 2-12 8 6 9 12 9 12-3 12-9", top: "32%", left: "30%", size: "190px", opacity: 0.1, rotate: "-10deg" },
  ],
  mizzed: [
    { path: "M14 18h36v22H30l-10 10V40h-6Z", top: "6%", left: "55%", size: "120px", opacity: 0.2, rotate: "-5deg" },
    { path: "M8 32c8-12 40-12 48 0c-8 12-40 12-48 0Z M32 26a6 6 0 1 1 0 12a6 6 0 1 1 0-12Z", top: "40%", left: "4%", size: "66px", opacity: 0.16, rotate: "6deg" },
    { path: "M32 52C20 40 10 32 10 22a12 12 0 0 1 22-6a12 12 0 0 1 22 6c0 10-10 18-22 30Z", top: "68%", left: "70%", size: "90px", opacity: 0.15, rotate: "-8deg" },
    { path: "M32 10a14 14 0 0 1 14 14c0 10-14 28-14 28s-14-18-14-28a14 14 0 0 1 14-14Z M32 20a5 5 0 1 1 0 10a5 5 0 1 1 0-10Z", top: "10%", left: "10%", size: "48px", opacity: 0.2, rotate: "4deg" },
  ],
  zspace: [
    { path: "M32 32L14 20M32 32L50 20M32 32L14 44M32 32L50 44M32 32V12M32 32V52", top: "4%", left: "52%", size: "112px", opacity: 0.2, rotate: "-4deg" },
    { path: "M8 12h16v16H8zM40 12h16v16H40zM8 36h16v16H8zM40 36h16v16H40zM24 20h16M24 44h16M16 28v8M48 28v8", top: "48%", left: "6%", size: "58px", opacity: 0.15, rotate: "3deg" },
    { path: "M32 8a24 24 0 1 0 .01 0Z M32 8v48M8 32h48", top: "66%", left: "64%", size: "84px", opacity: 0.16, rotate: "-5deg" },
    { path: "M8 8l48 48M56 8L8 56M32 4v56M4 32h56", top: "30%", left: "28%", size: "190px", opacity: 0.09, rotate: "0deg" },
  ],
  next: [
    { path: "M8 16h48M16 8v48M8 48h48M48 8v48", top: "4%", left: "56%", size: "96px", opacity: 0.14, rotate: "-8deg" },
    { path: "M8 40l14-24 8 12 8-16 18 28Z", top: "48%", left: "4%", size: "60px", opacity: 0.12, rotate: "5deg" },
    { path: "M32 8L44 28H20Z M20 28h24v24H20z", top: "70%", left: "62%", size: "78px", opacity: 0.13, rotate: "-3deg" },
    { path: "M32 4L58 50H6Z M32 4v46", top: "34%", left: "26%", size: "190px", opacity: 0.08, rotate: "8deg" },
  ],
};

/**
 * OUTZ topographic maps. Three real contour sets (canyon pass, ridge basin,
 * twin summits), each authored on a 600x600 field, placed across the card face
 * at different sizes so the OUTZ motif reads as terrain rather than as the
 * generic concentric rings it replaces.
 *
 * Stroke scales with the box (no non-scaling-stroke): a 600-unit field drawn at
 * 260px would otherwise render its 5-unit contour at a full 5 CSS px and read
 * as a doodle. Colour comes from `--c` on the card, so calm mode neutralises
 * these with everything else.
 */
export type WorldTopo = {
  name: string;
  paths: string[];
  top: string;
  left: string;
  size: string;
  opacity: number;
  rotate: string;
};

export const OUTZ_TOPO: WorldTopo[] = [
  {
    name: "twin-summits",
    top: "-6%",
    left: "46%",
    size: "300px",
    opacity: 0.3,
    rotate: "-8deg",
    paths: [
      "M300 32C198 25 103 99 119 194C52 254 70 354 132 389C89 482 176 570 286 560C394 584 508 514 473 406C548 344 535 235 468 195C486 99 402 38 300 32Z",
      "M300 73C220 66 145 120 156 197C101 247 115 326 165 356C130 434 198 523 289 515C378 535 464 477 436 398C497 347 486 263 430 228C448 149 381 79 300 73Z",
      "M294 116C232 111 183 151 190 207C147 247 158 305 198 329C170 394 221 477 292 470C362 486 425 441 405 381C451 341 443 282 399 255C413 190 355 121 294 116Z",
      "M245 159C207 176 205 225 235 248C204 288 214 335 248 357C219 405 246 445 286 447",
      "M348 154C390 168 398 216 369 244C405 282 399 330 366 353C394 397 371 440 326 449",
      "M245 159C272 139 306 144 326 169C345 197 331 228 303 240C275 249 244 230 235 202C230 184 234 169 245 159Z",
      "M348 154C377 142 405 155 417 181C429 211 411 239 383 249C356 256 328 237 321 208C317 183 329 163 348 154Z",
      "M277 191C291 180 310 185 316 201C320 217 309 229 294 229C279 227 270 211 277 191Z",
      "M364 185C379 177 395 184 400 199C403 215 392 227 377 227C363 224 355 207 364 185Z",
      "M112 468C172 429 205 376 242 330C274 291 312 274 347 235C375 204 408 178 455 151",
      "M126 480C101 450 107 417 126 417S151 450 126 480Z",
      "M244 350C219 320 225 287 244 287S269 320 244 350Z",
      "M371 252C346 222 352 189 371 189S396 222 371 252Z",
      "M455 174C430 144 436 111 455 111S480 144 455 174Z",
    ],
  },
  {
    name: "ridge-basin",
    top: "52%",
    left: "-16%",
    size: "250px",
    opacity: 0.24,
    rotate: "6deg",
    paths: [
      "M42 304C45 188 148 91 272 119C364 55 513 111 556 224C599 337 526 489 390 490C303 550 149 520 81 423C54 385 40 346 42 304Z",
      "M83 302C87 211 167 139 268 159C351 105 473 147 516 234C558 320 500 435 390 445C301 493 185 465 124 392C96 359 82 330 83 302Z",
      "M126 299C130 231 188 182 264 195C335 151 432 183 474 247C511 307 467 390 382 405C304 444 219 421 171 369C142 338 125 319 126 299Z",
      "M171 296C174 251 213 219 263 228C321 194 390 219 426 260C456 299 424 350 368 369C304 398 247 382 211 350C184 326 170 310 171 296Z",
      "M218 291C221 262 246 247 274 253C314 231 358 247 382 272C400 295 383 324 349 339C308 358 270 349 245 331C227 317 217 301 218 291Z",
      "M263 289C266 274 280 269 294 274C312 263 334 270 345 283C355 297 345 312 329 319C309 328 290 323 277 315C267 308 262 297 263 289Z",
      "M112 224C135 183 173 154 217 143M459 174C491 195 516 226 528 260",
      "M105 390C132 424 169 448 210 458M431 437C469 421 498 394 514 360",
      "M92 355C149 327 192 336 238 305C286 273 330 252 382 267C430 281 468 260 514 218",
      "M104 376C79 346 85 313 104 313S129 346 104 376Z",
      "M248 326C223 296 229 263 248 263S273 296 248 326Z",
      "M385 289C360 259 366 226 385 226S410 259 385 289Z",
      "M506 241C481 211 487 178 506 178S531 211 506 241Z",
    ],
  },
  {
    name: "canyon-pass",
    top: "26%",
    left: "24%",
    size: "180px",
    opacity: 0.16,
    rotate: "-3deg",
    paths: [
      "M292 31C205 38 142 111 162 193C89 235 75 333 134 391C96 489 181 572 281 554C376 584 486 513 459 411C527 354 517 252 451 210C472 121 382 24 292 31Z",
      "M293 76C227 82 182 136 196 199C137 236 129 308 174 354C143 430 207 514 284 498C359 523 438 467 419 391C474 347 466 279 414 244C429 175 359 68 293 76Z",
      "M291 121C244 126 218 164 228 207C183 239 184 290 217 324C195 381 242 455 288 440",
      "M298 121C345 127 380 174 366 215C407 244 409 294 378 329C401 384 360 452 314 442",
      "M273 161C251 174 251 203 269 217C247 241 250 270 271 287C253 317 263 348 286 365",
      "M320 159C344 171 347 200 329 216C350 241 348 269 328 288C346 318 338 349 314 366",
      "M290 194C282 201 283 213 292 218C300 220 308 214 308 205C307 197 299 192 290 194Z",
      "M287 365C273 390 276 416 292 434M314 366C327 390 324 416 307 435",
      "M134 391C188 368 227 382 265 417M459 411C406 382 366 391 333 422",
      "M174 492C217 454 250 417 275 374C297 337 303 301 298 257C294 217 305 177 350 128",
      "M178 513C153 483 159 450 178 450S203 483 178 513Z",
      "M278 396C253 366 259 333 278 333S303 366 278 396Z",
      "M299 279C274 249 280 216 299 216S324 249 299 279Z",
      "M351 151C326 121 332 88 351 88S376 121 351 151Z",
    ],
  },
];
