"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiService } from "@/services/api";
import FeedbackBox from "@/components/Essays/FeedbackBox";
import { EssayEvaluationResult } from "@/types/EssayEvaluationResult";
import { ADKMessage } from "@/types/ADKMessage";
import { parseADKResponse } from "@/utils/parseADKResponse";
import {
  ArrowLeft,
  FileText,
  Upload,
  Zap,
  Bot,
  Sparkles,
  Target,
  PenTool,
} from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import BackgroundBlur from "../ui/background-blur";

export default function SendEssay() {
  const [essayMainSubject, setEssayMainSubject] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<EssayEvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { userId, sessionId } = useSession();

  function resetEssay() {
    setResponse(null);
    setEssayMainSubject("");
    setText("");
    setFile(null);
  }

  const handleEnviar = async () => {
    if (!text.trim() && !file) {
      alert("Por favor, insira uma redação ou selecione um arquivo.");
      return;
    }
    
    setIsLoading(true);

    try {
      let payload;

      if (file) {
        // Se for imagem, simula envio com URL mockada (em vez de upload real por enquanto)
        //const final_text = `The user uploaded an essay as image with the following URL: https://storage.googleapis.com/edu-ai-essays/essay_01.jpg and you need to evaluate it.`;
        //payload = ApiService.createPayload(userId, sessionId, final_text);
        payload = await ApiService.createImagePayload(userId, sessionId, file);
        
      } else {
        // Se for texto direto
        const final_text = `The user uploaded an essay with the title/subject: ${essayMainSubject} and the following text: ${text} and you need to evaluate it.`;
        payload = ApiService.createPayload(userId, sessionId, final_text);
      }

      const data = await ApiService.runAgent(payload);
      const parsed = parseADKResponse<EssayEvaluationResult>(data.response);
      if (parsed) {
        setResponse(parsed);
        await ApiService.runAgent(
          ApiService.createPayload(
            userId,
            sessionId,
            `Save the essay evaluation result with the following data:\n${JSON.stringify(
              parsed
            )}`
          )
        );
      }
    } catch (error) {
      console.error("Erro ao enviar redação:", error);
      alert("Erro ao processar a redação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="mx-auto px-4 py-8 relative z-10">
        <BackgroundBlur />
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button className="button-secondary flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto">
          {!response ? (
            /* Essay input form */
            <div className="space-y-8">
              {/* Hero section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center px-4 py-2 mb-6 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm">
                  <FileText className="w-4 h-4 mr-2 text-purple-400" />
                  <span className="text-sm font-medium text-white/80">
                    Essay Evaluator AI Agent
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-white">
                  ENEM Essay
                  <br />
                  <span className="gradient-text">AI Evaluation</span>
                </h1>

                <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                  Get detailed feedback on your ENEM essay with AI-powered
                  analysis across all 5 competencies. Upload an image or paste
                  your text to start.
                </p>

                <Link href="/previous-essays">
                  <Button className="button-secondary mt-4">
                    <FileText className="w-4 h-4 mr-2" />
                    Previous Essays
                  </Button>
                </Link>
              </div>

              {/* Input form */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-3">
                    <PenTool className="h-6 w-6 text-purple-400" />
                    Submit Your Essay
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Enter your essay topic and content below.
                    {/*You can either type your essay or upload an image.*/}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Essay topic */}
                  <div className="space-y-2">
                    <label className="block text-white font-medium">
                      Essay Topic
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:border-white/40 focus:outline-none transition-colors"
                      placeholder="Enter the essay topic..."
                      value={essayMainSubject}
                      onChange={(e) => setEssayMainSubject(e.target.value)}
                    />
                  </div>

                  {/* File upload */}
                  <div className="space-y-2">
                    <label className="block text-white font-medium flex items-center gap-2">
                      <Upload className="h-4 w-4 text-purple-400" />
                      Upload Essay Image
                    </label>
                    <div
                      className={`
                        border-2 border-dashed rounded-xl text-center transition-all duration-300 relative
                        ${
                          file
                            ? "border-purple-400/50 bg-purple-400/5"
                            : "border-white/20 hover:border-white/40"
                        }
                      `}
                    >
                      {file ? (
                        <div className="p-8 space-y-4">
                          <div className="flex items-center justify-center gap-2 text-purple-400">
                            <FileText className="h-8 w-8" />
                            <span className="font-medium">{file.name}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => setFile(null)}
                              className="button-secondary"
                            >
                              Choose Different File
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label className="block cursor-pointer p-8">
                          <div className="space-y-4">
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-12 w-12 text-white/40" />
                              <div className="space-y-1">
                                <p className="text-white font-medium">
                                  Drag and drop your file here
                                </p>
                                <p className="text-white/50 text-sm">
                                  or click to browse
                                </p>
                              </div>
                            </div>
                            <input
                              type="file"
                              accept="image/*, application/pdf"
                              onChange={(e) =>
                                setFile(e.target.files?.[0] || null)
                              }
                              className="hidden"
                            />
                            <div className="flex flex-col items-center gap-1">
                              <p className="text-white/50 text-sm">
                                Supported formats: JPG, PNG, PDF
                              </p>
                              <p className="text-white/50 text-sm">
                                Maximum file size: 10MB
                              </p>
                            </div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-background text-white/50">
                        or paste your essay text below
                      </span>
                    </div>
                  </div>

                  {/* Essay text */}
                  <div className="space-y-2">
                    <label className="block text-white font-medium flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-purple-400" />
                      Essay Content
                    </label>
                    <textarea
                      className={`
                        w-full bg-white/5 border rounded-xl p-4 text-white placeholder-white/50 transition-colors resize-none
                        ${
                          file
                            ? "border-white/10 bg-white/5 cursor-not-allowed"
                            : "border-white/20 focus:border-white/40 focus:outline-none"
                        }
                      `}
                      rows={12}
                      placeholder="Paste your essay here."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      disabled={!!file}
                    />
                  </div>

                  {/* Submit button */}
                  <Button
                    onClick={handleEnviar}
                    disabled={isLoading}
                    className={`w-full py-4 text-lg font-medium rounded-xl transition-all duration-300 ${
                      isLoading
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "button-primary hover:scale-105"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                        Processing Essay...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Evaluate Essay
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Results section */
            <div className="space-y-8">
              {/* Results header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center px-4 py-2 mb-6 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm">
                  <Target className="w-4 h-4 mr-2 text-green-400" />
                  <span className="text-sm font-medium text-white/80">
                    Evaluation Complete
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
                  Your Essay
                  <br />
                  <span className="gradient-text">Results</span>
                </h2>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => resetEssay()}
                    variant="outline"
                    className="button-secondary"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Evaluate Another Essay
                  </Button>

                  <Link href="/dashboard">
                    <Button className="button-primary">
                      <Bot className="w-4 h-4 mr-2" />
                      Try Other Agents
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Feedback results */}
              <FeedbackBox data={response} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
