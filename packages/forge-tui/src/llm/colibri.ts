import http from "node:http";

export type ColibriStreamCallbacks = {
  onThinking?: (thought: string) => void;
  onToken?: (token: string) => void;
  onError?: (err: Error) => void;
  onComplete?: () => void;
};

export type ColibriModelProfile = {
  id: string;
  name: string;
  family: string;
  parameterSize: string;
  quantization: string;
  contextWindow: number;
  diskSize: string;
  ramRequirement: string;
  gpuRequirement: string;
  tier: "local_ollama" | "colibri_moe" | "cloud_zen";
};

export const COLIBRI_REGISTRY: ColibriModelProfile[] = [
  {
    id: "ornith-1.5:9b",
    name: "Ornith-1.5 (9B Q4_K_M)",
    family: "qwen35",
    parameterSize: "9.0B",
    quantization: "Q4_K_M",
    contextWindow: 262144,
    diskSize: "6.6 GB",
    ramRequirement: "8 GB RAM",
    gpuRequirement: "CPU-first / Optional CUDA",
    tier: "local_ollama",
  },
  {
    id: "olmoe",
    name: "OLMoE (1B-7B Active)",
    family: "moe",
    parameterSize: "7B",
    quantization: "int8",
    contextWindow: 65536,
    diskSize: "7 GB",
    ramRequirement: "8 GB RAM",
    gpuRequirement: "CPU-first",
    tier: "colibri_moe",
  },
  {
    id: "glm-5.2",
    name: "GLM-5.2 (744B MoE)",
    family: "glm",
    parameterSize: "744B",
    quantization: "int4",
    contextWindow: 131072,
    diskSize: "372 GB",
    ramRequirement: "25 GB RAM",
    gpuRequirement: "NVMe Streaming (No GPU required)",
    tier: "colibri_moe",
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    family: "deepseek",
    parameterSize: "167B",
    quantization: "int4",
    contextWindow: 131072,
    diskSize: "167 GB",
    ramRequirement: "16 GB min, 32 GB comfortable",
    gpuRequirement: "Optional sm_80+ (RTX 50 5-10x prefill)",
    tier: "colibri_moe",
  },
  {
    id: "qwen3.6-35b-a3b",
    name: "Qwen3.6-35B-A3B",
    family: "qwen",
    parameterSize: "35B",
    quantization: "int4-gs64",
    contextWindow: 131072,
    diskSize: "20 GB",
    ramRequirement: "24 GB RAM",
    gpuRequirement: "Optional CUDA VRAM tier (7.0x speedup)",
    tier: "colibri_moe",
  },
  {
    id: "big-pickle",
    name: "OpenCode Big Pickle",
    family: "cloud-zen",
    parameterSize: "Dense MoE",
    quantization: "fp16",
    contextWindow: 200000,
    diskSize: "Cloud Hosted",
    ramRequirement: "Zero Local RAM",
    gpuRequirement: "Zero Local GPU",
    tier: "cloud_zen",
  },
];

export class ColibriEngine {
  private activeModel: string;
  private port: number = 11434;
  private host: string = "127.0.0.1";

  constructor(modelId: string = "ornith-1.5:9b") {
    this.activeModel = modelId;
  }

  setModel(modelId: string) {
    this.activeModel = modelId;
  }

  getActiveModelProfile(): ColibriModelProfile | undefined {
    return COLIBRI_REGISTRY.find((m) => m.id === this.activeModel) || COLIBRI_REGISTRY[0];
  }

  async streamAnalysis(
    datasetContext: string,
    userQuery: string,
    callbacks: ColibriStreamCallbacks
  ): Promise<void> {
    const prompt = `You are DataForge, an elite autonomous data engineering and pattern discovery intelligence running on the Colibri / Local Engine architecture with model Ornith-1.5:9B.

Context:
${datasetContext}

User Query:
${userQuery}

Provide a concise, high-impact analysis highlighting 2 key hidden mathematical patterns and actionable data model recommendations.`;

    const postData = JSON.stringify({
      model: this.activeModel,
      messages: [
        {
          role: "system",
          content: "You are DataForge, an expert data engineering and pattern analysis assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
      options: {
        num_predict: 256,
        temperature: 0.3,
      },
    });

    return new Promise((resolve) => {
      const req = http.request(
        {
          host: this.host,
          port: this.port,
          path: "/api/chat",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
          },
          timeout: 0,
        },
        (res) => {
          let buffer = "";

          res.on("data", (chunk) => {
            buffer += chunk.toString("utf8");
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.message?.thinking) {
                  callbacks.onThinking?.(parsed.message.thinking);
                }
                if (parsed.message?.content) {
                  callbacks.onToken?.(parsed.message.content);
                }
                if (parsed.done) {
                  callbacks.onComplete?.();
                  resolve();
                  return;
                }
              } catch {}
            }
          });

          res.on("end", () => {
            callbacks.onComplete?.();
            resolve();
          });
        }
      );

      req.on("error", (err) => {
        callbacks.onError?.(err);
        resolve();
      });

      req.write(postData);
      req.end();
    });
  }
}
