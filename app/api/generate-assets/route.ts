import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export async function GET() {
  const log: string[] = [];
  try {
    const artifactsDir = "C:\\Users\\SHREYAS\\.gemini\\antigravity-ide\\brain\\94c7b7f3-328f-45db-acd7-7bdcf9f65bbe";
    const demoDir = "c:\\Users\\SHREYAS\\OneDrive\\Desktop\\BE_proj\\application\\Weapon_detection_model\\Real-Time-Weapon-Detection\\Demo";
    
    // Ensure artifacts directory exists
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    // 1. Copy the weapon detection graphs
    const weaponFiles: Record<string, string> = {
      "mAP@.5IOU.png": "weapon_map.png",
      "respons_time.png": "weapon_response_time.png",
      "IOU.png": "weapon_iou.png"
    };

    for (const [srcName, dstName] of Object.entries(weaponFiles)) {
      const srcPath = path.join(demoDir, srcName);
      const dstPath = path.join(artifactsDir, dstName);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, dstPath);
        log.push(`Copied ${srcName} to ${dstName}`);
      } else {
        log.push(`Source not found: ${srcPath}`);
      }
    }

    // 2. Trigger python generation script
    const pyScript = path.join(artifactsDir, "scratch", "generate_report_assets.py");
    
    await new Promise<void>((resolve, reject) => {
      exec(`python "${pyScript}"`, (error, stdout, stderr) => {
        if (error) {
          log.push(`Python exec error: ${error.message}`);
          log.push(`Python stderr: ${stderr}`);
          resolve(); // Resolve anyway so we can see what succeeded
        } else {
          log.push(`Python stdout: ${stdout}`);
          resolve();
        }
      });
    });

    return NextResponse.json({
      success: true,
      log
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      log
    }, { status: 500 });
  }
}
