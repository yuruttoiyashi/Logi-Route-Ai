import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import OpenAI from "openai";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

type DelayAnalysisRequest = {
  destination?: string;
  scheduledTime?: string;
  driverName?: string;
  trafficLevel?: string;
  weather?: string;
  status?: string;
  memo?: string;
};

type DelayAnalysisResponse = {
  riskLevel: "low" | "medium" | "high";
  score: number;
  summary: string;
  factors: string[];
  actions: string[];
};

export const analyzeDelayRisk = onCall(
  {
    region: "asia-northeast1",
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [OPENAI_API_KEY],
  },
  async (request): Promise<DelayAnalysisResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "ログインが必要です。");
    }

    const data = request.data as DelayAnalysisRequest;

    const destination = data.destination ?? "";
    const scheduledTime = data.scheduledTime ?? "";
    const driverName = data.driverName ?? "";
    const trafficLevel = data.trafficLevel ?? "";
    const weather = data.weather ?? "";
    const status = data.status ?? "";
    const memo = data.memo ?? "";

    if (!destination && !memo) {
      throw new HttpsError(
        "invalid-argument",
        "destination または memo のどちらかは必要です。"
      );
    }

    try {
      const client = new OpenAI({
        apiKey: OPENAI_API_KEY.value(),
      });

      const prompt = `
あなたは物流会社向けの配車・配送オペレーション支援AIです。
以下の配送情報をもとに、遅延リスクを分析してください。

配送先: ${destination}
予定時刻: ${scheduledTime}
ドライバー: ${driverName}
交通状況: ${trafficLevel}
天候: ${weather}
ステータス: ${status}
メモ: ${memo}

JSON形式で返してください：
{
  "riskLevel": "low | medium | high",
  "score": 0,
  "summary": "要約",
  "factors": ["要因"],
  "actions": ["対策"]
}
`;

      const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: prompt,
      });

      const text = response.output_text?.trim();

      if (!text) {
        throw new Error("AIの応答が空です");
      }

      const parsed = JSON.parse(text) as DelayAnalysisResponse;

      return parsed;
    } catch (error: unknown) {
      console.error("analyzeDelayRisk error:", error);

      let message = "AI分析中にエラーが発生しました。";
      if (error instanceof Error) {
        message = error.message;
      }

      throw new HttpsError("internal", message);
    }
  }
);