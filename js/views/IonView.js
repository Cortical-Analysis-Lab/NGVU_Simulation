console.log("cortical column view loaded");

const CORTICAL_COLUMN_FRAME = {
  width: 1040,
  height: 640
};

const CORTICAL_COLUMN_SCALE = 0.98;

let corticalColumnPlaceholderImage = null;

function ensureCorticalColumnPlaceholderImage() {
  if (corticalColumnPlaceholderImage) return corticalColumnPlaceholderImage;

  const g = createGraphics(420, 260);
  g.clear();
  g.noStroke();

  for (let y = 0; y < g.height; y++) {
    const t = y / max(1, g.height - 1);
    const r = lerp(26, 14, t);
    const gg = lerp(36, 18, t);
    const b = lerp(54, 24, t);
    g.fill(r, gg, b, 255);
    g.rect(0, y, g.width, 1);
  }

  g.push();
  g.translate(g.width * 0.5, g.height * 0.54);
  g.rectMode(CENTER);

  g.noStroke();
  g.fill(24, 28, 38, 220);
  g.rect(0, 0, 352, 184, 28);

  g.fill(255, 194, 74, 240);
  g.rect(0, 70, 292, 24, 10);
  g.fill(34, 38, 48, 255);
  for (let i = -118; i <= 118; i += 34) {
    g.quad(i - 10, 58, i + 4, 58, i + 18, 82, i + 4, 82);
  }

  g.fill(242, 174, 86, 245);
  g.triangle(-108, 62, -76, -48, -44, 62);
  g.triangle(108, 62, 76, -48, 44, 62);

  g.fill(250, 224, 146, 255);
  g.ellipse(-76, -6, 18, 18);
  g.ellipse(76, -6, 18, 18);

  g.fill(236, 242, 248, 245);
  g.textAlign(CENTER, CENTER);
  g.textStyle(BOLD);
  g.textSize(26);
  g.text("UNDER", 0, -80);
  g.text("CONSTRUCTION", 0, -46);

  g.textSize(13);
  g.textStyle(NORMAL);
  g.fill(182, 198, 214, 240);
  g.text("Cortical column scene in progress", 0, 104);

  g.pop();

  corticalColumnPlaceholderImage = g;
  return corticalColumnPlaceholderImage;
}

function drawIonView() {
  push();
  resetMatrix();

  const sx = width / CORTICAL_COLUMN_FRAME.width;
  const sy = height / CORTICAL_COLUMN_FRAME.height;
  const fitScale = min(sx, sy) * CORTICAL_COLUMN_SCALE;

  const viewW = CORTICAL_COLUMN_FRAME.width * fitScale;
  const viewH = CORTICAL_COLUMN_FRAME.height * fitScale;
  const viewX = (width - viewW) / 2;
  const viewY = (height - viewH) / 2;

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(viewX, viewY, viewW, viewH);
  drawingContext.clip();

  translate(viewX + viewW / 2, viewY + viewH / 2);
  scale(fitScale);

  drawCorticalColumnBackdrop();
  drawCorticalColumnPlaceholder();

  drawingContext.restore();
  pop();
}

function drawCorticalColumnBackdrop() {
  push();
  rectMode(CENTER);
  noStroke();

  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    fill(
      lerp(20, 10, t),
      lerp(28, 16, t),
      lerp(40, 24, t),
      255
    );
    rect(0, 0, CORTICAL_COLUMN_FRAME.width - i * 32, CORTICAL_COLUMN_FRAME.height - i * 22, 28);
  }

  fill(36, 52, 74, 44);
  ellipse(-240, -130, 340, 220);
  ellipse(260, 140, 420, 250);
  pop();
}

function drawCorticalColumnPlaceholder() {
  const img = ensureCorticalColumnPlaceholderImage();

  push();
  imageMode(CENTER);
  image(img, 0, -18, 420, 260);

  textAlign(CENTER, CENTER);
  noStroke();

  fill(255, 214, 120);
  textStyle(BOLD);
  textSize(34);
  text("CORTICAL COLUMN", 0, -214);

  fill(244, 246, 250);
  textSize(52);
  text("Under Construction", 0, 160);
  pop();
}
