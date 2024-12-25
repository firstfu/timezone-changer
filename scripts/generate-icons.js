const sharp = require("sharp")
const fs = require("fs").promises
const path = require("path")

const sizes = [16, 32, 48, 128]

async function generateIcons() {
  try {
    const inputSvg = await fs.readFile(
      path.join(__dirname, "../assets/icon.svg")
    )
    const assetsDir = path.join(__dirname, "../assets")

    // 確保 assets 目錄存在
    await fs.mkdir(assetsDir, { recursive: true })

    await Promise.all(
      sizes.map(async (size) => {
        const outputPath = path.join(assetsDir, `icon${size}.png`)
        await sharp(inputSvg).resize(size, size).png().toFile(outputPath)
        console.log(`Generated ${outputPath}`)
      })
    )
  } catch (error) {
    console.error("Error generating icons:", error)
    process.exit(1)
  }
}

generateIcons()
