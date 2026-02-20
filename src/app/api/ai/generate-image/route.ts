import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { prompt, entityId, entityType, referenceImage } = await req.json();

        if (!prompt) {
            return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
        }

        let improvedPrompt = prompt;

        // If there's a reference image, use Gemini to analyze it and improve the generation prompt
        if (referenceImage) {
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

            // Extract base64 data
            const base64Data = referenceImage.split(",")[1];
            const mimeType = referenceImage.split(";")[0].split(":")[1];

            const result = await model.generateContent([
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                },
                `Based on this reference image and the user's prompt "${prompt}", describe a high-quality, professional product photo for a furniture catalog. 
                Focus on lighting, material texture, and background. Keep it to one short paragraph.`
            ]);

            improvedPrompt = result.response.text();
        }

        console.log(`AI Image Generation for: ${improvedPrompt}`);

        let generatedDataUrl: string | null = null;
        let usedFallback = false;

        // Try Gemini first (requires billing enabled)
        try {
            const imageModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" });

            // Build the content parts for the image generation request
            const contentParts: any[] = [];
            
            // If we have a reference image, include it for image-to-image generation
            if (referenceImage) {
                const base64Data = referenceImage.split(",")[1];
                const mimeType = referenceImage.split(";")[0].split(":")[1];
                
                contentParts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType,
                    }
                });
            }
            
            // Add the text prompt
            contentParts.push({
                text: `Create a high-quality, professional product photograph: ${improvedPrompt}`
            });

            // Generate the image
            const result = await imageModel.generateContent(contentParts);
            const response = await result.response;
            
            // Extract the generated image from the response
            if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        if (part.inlineData) {
                            const mimeType = part.inlineData.mimeType || "image/png";
                            const base64Data = part.inlineData.data;
                            generatedDataUrl = `data:${mimeType};base64,${base64Data}`;
                            break;
                        }
                    }
                }
            }
        } catch (geminiErr: any) {
            console.warn("Gemini image generation failed, trying Hugging Face fallback:", geminiErr.message);
            usedFallback = true;

            // Fallback to Pollinations.ai with API key
            try {
                console.log("Using Pollinations.ai fallback");
                
                const pollinationsKey = process.env.POLLINATIONS_API_KEY;
                
                if (!pollinationsKey) {
                    throw new Error("POLLINATIONS_API_KEY not found in environment");
                }
                
                // Use Pollinations API with authentication (GET endpoint)
                const encodedPrompt = encodeURIComponent(improvedPrompt);
                const pollinationsUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux`;
                
                const pollinationsResponse = await fetch(pollinationsUrl, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${pollinationsKey}`,
                    },
                });
                
                if (!pollinationsResponse.ok) {
                    const errorText = await pollinationsResponse.text();
                    throw new Error(`Pollinations API error: ${errorText.substring(0, 200)}`);
                }
                
                // The response is the image itself
                const imageBlob = await pollinationsResponse.blob();
                const arrayBuffer = await imageBlob.arrayBuffer();
                const base64Image = Buffer.from(arrayBuffer).toString('base64');
                generatedDataUrl = `data:${imageBlob.type};base64,${base64Image}`;


            } catch (fallbackErr: any) {
                console.error("Image generation fallback failed:", fallbackErr);
                return NextResponse.json({ 
                    success: false, 
                    error: `Image generation unavailable. Enable Gemini billing at https://console.cloud.google.com/billing for AI-generated images.` 
                }, { status: 503 });
            }
        }

        if (!generatedDataUrl) {
            return NextResponse.json({ 
                success: false, 
                error: "Image generation failed (no image returned by model)" 
            }, { status: 500 });
        }

        // Persist the generated image as a data URL (or you could upload to storage and save the public URL)
        if (entityId) {
            if (entityType === "STOCK") {
                await prisma.stock.update({ where: { id: entityId }, data: { imageUrl: generatedDataUrl } });
            } else if (entityType === "FABRIC") {
                await prisma.fabricType.update({ where: { id: entityId }, data: { imageUrl: generatedDataUrl } });
            }
        }

        return NextResponse.json({ 
            success: true, 
            data: { 
                url: generatedDataUrl, 
                prompt: improvedPrompt,
                provider: usedFallback ? "pollinations" : "gemini"
            } 
        });

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
