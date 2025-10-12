import React, { useState, useEffect } from "react";
import "./dashboard.css";
import Sidebar from "../../components/sidebar"; // Assicurati che il percorso sia corretto
import Topbar from "../../components/topbar"; // Assicurati che il percorso sia corretto

interface AIMessage {
  id: number;
  type: "user" | "ai";
  message: string;
  timestamp: Date;
}

const Dashboard: React.FC = () => {
  const [menuState, setMenuState] = useState<"open" | "closed">("open");
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [newsData, setNewsData] = useState<any[]>([]);

  const AI_ASSISTANT_ENABLED = true; // 👈 Flag per attivare/disattivare AI

  // Stati AI
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  const API_URL = import.meta.env.VITE_API_URL;

  // Simula il caricamento delle notizie
  useEffect(() => {
    const loadNews = () => {
      const mockNews = [
        {
          id: 1,
          title: "Alcuni computer Mac con l'aggiornamento....",
          date: new Date(Date.now() - 86400000),
          content:
            "Alcuni modelli di Mac potrebbero riscontrare ritardi nel caricamento di Diagnosi Apple o delle diagnostiche EFI di AST 2 dopo i seguenti aggiornamenti: Aggiornamento a macOS Big Sur 11.3 Aggiornamento del firmware del chip di sicurezza Apple T2 alla versione più recente dopo aver eseguito correttamente le suite Configurazione di sistema, Riattiva dispositivo o un ripristino con Apple Configurator 2 I modelli di Mac interessati si collegheranno alla Console di diagnostica di AST 2 e possono visualizzare il messaggio 'Attendo il supporto...' per diversi minuti.",
        },
        {
          id: 2,
          title: "Trasformazione di GSX - Fase 2: ...",
          date: new Date(Date.now() - 172800000),
          content: "Informazioni sulla fase 2......",
        },
        {
          id: 3,
          title: "Suggerimenti per ridurre l'impatto ambiantale ...",
          date: new Date(Date.now() - 259200000),
          content: "Suggerimenti per ridurre l'impatto ambientale...",
        },
      ];
      setNewsData(mockNews);
    };

    loadNews();

    // Carica lo stato del menu dal sessionStorage
    const savedMenuState = sessionStorage.getItem("menuState");
    if (savedMenuState === "closed") {
      setMenuState("closed");
    }
  }, []);

  // Gestione del toggle del menu
  const toggleMenu = () => {
    const newState = menuState === "open" ? "closed" : "open";
    setMenuState(newState);
    sessionStorage.setItem("menuState", newState);
  };

  // Gestione della selezione di una notizia
  const handleSelectNews = (newsId: number) => {
    const newsItem = newsData.find((item) => item.id === newsId);
    setSelectedNews(newsItem);
  };

  // Gestione data e ora
  const [currentDate, setCurrentDate] = useState({
    day: "",
    date: "",
    month: "",
  });

  useEffect(() => {
    const days = [
      "Domenica",
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
    ];
    const now = new Date();

    setCurrentDate({
      day: days[now.getDay()].toUpperCase(),
      date: now.getDate().toString(),
      month: now.toLocaleString("it-IT", { month: "long" }),
    });

    // Disegna l'orologio
    const drawClock = () => {
      const canvas = document.getElementById(
        "clockCanvas"
      ) as HTMLCanvasElement;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100;
      const now = new Date();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Disegna le tacche dei secondi
      for (let i = 0; i < 60; i++) {
        const angle = (i * Math.PI) / 30;
        const x1 = centerX + Math.cos(angle) * (radius - 5);
        const y1 = centerY + Math.sin(angle) * (radius - 5);
        const x2 =
          centerX + Math.cos(angle) * (radius - (i % 5 === 0 ? 15 : 10));
        const y2 =
          centerY + Math.sin(angle) * (radius - (i % 5 === 0 ? 15 : 10));

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 5 === 0 ? "black" : "gray";
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.stroke();
      }

      // Disegna i numeri delle ore
      ctx.font = "16px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 1; i <= 12; i++) {
        const angle = (i * Math.PI) / 6 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius - 25);
        const y = centerY + Math.sin(angle) * (radius - 25);
        ctx.fillText(i.toString(), x, y);
      }

      // Ottenere ore, minuti e secondi
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Calcolo degli angoli
      const hourAngle = ((hours + minutes / 60) * Math.PI) / 6 - Math.PI / 2;
      const minuteAngle =
        ((minutes + seconds / 60) * Math.PI) / 30 - Math.PI / 2;
      const secondAngle = (seconds * Math.PI) / 30 - Math.PI / 2;

      // Disegna la lancetta delle ore
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(hourAngle) * (radius * 0.5),
        centerY + Math.sin(hourAngle) * (radius * 0.5)
      );
      ctx.strokeStyle = "black";
      ctx.lineWidth = 5;
      ctx.stroke();

      // Disegna la lancetta dei minuti
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(minuteAngle) * (radius * 0.7),
        centerY + Math.sin(minuteAngle) * (radius * 0.7)
      );
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Disegna la lancetta dei secondi (arancione)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(secondAngle) * (radius * 0.9),
        centerY + Math.sin(secondAngle) * (radius * 0.9)
      );
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Disegna il punto centrale
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "black";
      ctx.fill();
    };

    drawClock();
    const clockInterval = setInterval(drawClock, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Ottieni API Key OpenAI dal backend
  const getOpenAIApiKey = async (): Promise<string> => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      throw new Error(
        "Token di autenticazione non trovato. Effettua il login."
      );
    }

    try { 

      const response = await fetch(`${API_URL}/api/OpenAi/get-key`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("isAuthenticated");
          throw new Error("Sessione scaduta. Effettua nuovamente il login.");
        }
        throw new Error(`Errore nel recupero dell'API key: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.apiKey) {
        throw new Error("API key non disponibile dal server");
      }

      return data.apiKey;
    } catch (error) {
      console.error("Errore nel recupero dell'API key:", error);
      throw error;
    }
  };

  // Ottieni risposta AI
  const getAIResponse = async (question: string): Promise<string> => {
    try {
      const openaiApiKey = await getOpenAIApiKey();

      const systemPrompt = `Sei l’assistente AI di MediaLab per assistenza Apple (iPhone/iPad/Watch). Fornisci diagnosi preliminari, check rapidi, istruzioni sicure e next-step nel flusso Medialab FE (crea ticket, preventivo, diagnosi, stampa consegna, note cliente).
    
EXPERTISE (Assistenza Apple)
• Triage/diagnosi iOS-iPadOS: avvio, boot-loop, crash, performance, storage
• Hardware: display, batteria, connettori (Lightning/USB-C), audio/foto/sensori, radio (Wi-Fi/BT/Cell)
• Face ID/Touch ID: test funzionali, limiti di accoppiamento, criteri invio in laboratorio
• Danni liquidi/urti: procedure conservative (no riaccensione/ricarica), LCI, bonifica
• Backup & ripristino: iCloud/Finder, Recovery/DFU con avvertenze, preservazione dati
• Account & servizi: Apple ID/iCloud/Activation Lock (no bypass), Find My, iMessage/FaceTime, profili/MDM
• Conformità & privacy: no password/codici 2FA; maschera IMEI/seriale; flusso Medialab FE (ticket → diagnosi → preventivo → stampa)

Rispondi in italiano, professionale, chiaro e conciso. Vai al sodo con indicazioni pratiche e azionabili. Evita gergo inutile. Se mancano dati, chiedi solo le 3–5 info minime per sbloccare il caso.`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: question,
              },
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error("API key OpenAI non valida o scaduta");
        } else if (response.status === 429) {
          throw new Error(
            "Limite di utilizzo OpenAI raggiunto. Riprova tra poco."
          );
        } else if (response.status >= 500) {
          throw new Error("Servizio OpenAI temporaneamente non disponibile");
        }

        throw new Error(
          `Errore API OpenAI: ${response.status} - ${
            errorData.error?.message || "Errore sconosciuto"
          }`
        );
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error("Risposta non valida dal servizio AI");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Errore chiamata OpenAI:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("Token di autenticazione") ||
          error.message.includes("Sessione scaduta")
        ) {
          window.location.href = "/login";
          return "Sessione scaduta. Reindirizzamento al login...";
        }
        return error.message;
      }

      return "Si è verificato un errore imprevisto. Riprova tra poco.";
    }
  };

  // Invia domanda all'AI
  const handleSendQuestion = async (questionOverride?: string) => {
    const questionToSend = questionOverride || currentQuestion;
    if (!questionToSend.trim()) return;

    setAiError("");

    const userMessage: AIMessage = {
      id: Date.now(),
      type: "user",
      message: questionToSend,
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    if (!questionOverride) {
      setCurrentQuestion("");
    }
    setIsAiTyping(true);

    try {
      const aiResponseText = await getAIResponse(questionToSend);

      const aiResponse: AIMessage = {
        id: Date.now() + 1,
        type: "ai",
        message: aiResponseText,
        timestamp: new Date(),
      };

      setAiMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Errore durante la risposta AI:", error);

      let errorMessage = "Si è verificato un errore. Riprova tra poco.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setAiError(errorMessage);

      const errorAIMessage: AIMessage = {
        id: Date.now() + 1,
        type: "ai",
        message: `⚠️ ${errorMessage}`,
        timestamp: new Date(),
      };

      setAiMessages((prev) => [...prev, errorAIMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Gestione tasto Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion();
    }
  };

  return (
    <div
      className={`d-flex ${menuState === "closed" ? "menu-closed" : ""}`}
      id="wrapper"
    >
      {/* Nuova Sidebar */}
      <Sidebar menuState={menuState} toggleMenu={toggleMenu} />

      {/* Main Content */}
      <div id="page-content-wrapper">
        <Topbar toggleMenu={toggleMenu} />

        {/* Page content */}
        <div className="content-scroll">
          <div className="container-fluid">
            <div>
              <p />
              <p />
              <p />
            </div>

            {/* Box Top Riepilogo */}
            <div className="container">
              <div className="box purple">
                <i className="fa-solid fa-sack-dollar icon"></i>
                <div className="text">
                  <span>Totale</span>
                  <span>Mese</span>
                  <span>Oggi</span>
                </div>
              </div>
              <div className="box dark">
                <i className="fa-solid fa-screwdriver icon"></i>
                <div className="text">
                  <span>Riparazioni</span>
                </div>
              </div>
              <div className="box dark">
                <i className="fa-solid fa-mobile-screen-button icon"></i>
                <div className="text">
                  <span>Vendite Dispositivi</span>
                  <span>Usato</span>
                  <span>Nuovo</span>
                </div>
              </div>
              <div className="box grey">
                <i className="fa fa-wallet icon"></i>
                <div className="text">
                  <span>Vendite Accessori</span>
                </div>
              </div>
              <div className="box grey">
                <i className="fa fa-heartbeat icon"></i>
                <div className="text">
                  <span>Interventi Software</span>
                </div>
              </div>
              <div className="box light-grey">
                <i className="fa fa-arrow-down icon"></i>
                <div className="text">
                  <span>Spese</span>
                </div>
              </div>
            </div>

            {/* Seconda Riga con Informazioni */}
            <div className="info-container">
              <div className="date-box improved">
                <span className="day-label">{currentDate.day}</span>
                <span className="number">{currentDate.date}</span>
                <span className="event">Nessun evento oggi</span>
              </div>

              <div className="clock-container">
                <canvas id="clockCanvas" width="250" height="250"></canvas>
              </div>

              <div className="stats-box-dashboard">
                <div className="icon-container">
                  <i className="fa-solid fa-user"></i>
                </div>
                <span>
                  <strong>1240</strong> Clienti
                </span>
              </div>

              <div className="stats-box-dashboard">
                <div className="icon-container">
                  <i className="fa-solid fa-screwdriver-wrench icon-large"></i>
                </div>
                <span>
                  <strong>2950</strong> Riparazioni
                </span>
              </div>

              <div className="stats-box-dashboard">
                <span className="success-rate">
                  <strong className="big-number">98%</strong>
                  <span className="small-text">Rip. svolte con successo</span>
                </span>
              </div>

              <div className="search-box">
                <span className="greeting">Salve</span>
                <div className="search-container">
                  <span className="search-icon">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Trova imei, riparazioni, garanzie, clienti ed altro"
                  />
                </div>
              </div>
            </div>

            <div className="main-container">
              {/* Sinistra: News e Comunicazioni */}
              <div className="left-panel">
                <div className="card bg-light text-black">
                  <div className="custom-card-header-news">
                    <span className="header-title">Service News</span>
                    <div className="search-container-news">
                      <span className="search-icon-news">
                        <i className="fa-solid fa-magnifying-glass"></i>
                      </span>
                      <input
                        type="text"
                        className="search-input-news"
                        placeholder="Cerca Service News"
                      />
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="service-news-box">
                      <div className="news-list">
                        {newsData.map((news) => (
                          <div key={news.id} className="news-item">
                            <button
                              className="news-link"
                              onClick={() => handleSelectNews(news.id)}
                            >
                              <strong>{news.title}</strong>
                              <br />
                              <small className="text-muted">
                                {news.date.toLocaleDateString("it-IT")}
                              </small>
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="news-detail">
                        {selectedNews && (
                          <div className="news-content">
                            <h4 className="fw-bold">{selectedNews.title}</h4>
                            <small className="text-muted">
                              {selectedNews.date.toLocaleDateString("it-IT")}
                            </small>
                            <hr />
                            <p>{selectedNews.content}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destra: Impegni */}
              <div className="right-panel">
                <div className="card bg-light text-black">
                  <div className="custom-card-header">Impegni</div>
                  <div className="card-body">
                    <div className="service-news-box-right">
                      <h5 className="card-title">
                        Nessuna Comunicazione Disponibile
                      </h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p />
              <p />
              <p />
            </div>

            {/* ========================================
    AI ASSISTANT SECTION - DA INSERIRE DOPO LE NEWS
    ======================================== */}
            <div className="ai-assistant-section">
              <div className="row">
                <div className="col-12">
                  <div className="ai-assistant-container">
                    <div className="ai-assistant-header">
                      <div className="ai-header-content">
                        <div className="ai-header-left">
                          <div className="ai-icon-large">
                            <i className="fa-solid fa-robot"></i>
                          </div>
                          <div className="ai-header-text">
                            <h3>AI Assistant</h3>
                            <p>
                              {AI_ASSISTANT_ENABLED
                                ? "Il tuo assistente intelligente per supporto e analisi"
                                : "Assistente AI temporaneamente non disponibile"}
                            </p>
                          </div>
                        </div>
                        <div className="ai-status">
                          <div
                            className={`ai-status-indicator ${
                              AI_ASSISTANT_ENABLED ? "online" : "offline"
                            }`}
                          ></div>
                          <span>
                            {AI_ASSISTANT_ENABLED ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ai-assistant-body">
                      {!AI_ASSISTANT_ENABLED && (
                        <div className="alert alert-info" role="alert">
                          <i className="fa-solid fa-info-circle"></i>{" "}
                          L'assistente AI è attualmente disattivato.
                        </div>
                      )}

                      {aiError && AI_ASSISTANT_ENABLED && (
                        <div className="alert alert-warning" role="alert">
                          <i className="fa-solid fa-exclamation-triangle"></i>{" "}
                          {aiError}
                        </div>
                      )}

                      {/* Chat Container con Scroll Verticale */}
                      <div className="ai-chat-container">
                        {aiMessages.length === 0 ? (
                          <div className="ai-welcome">
                            <div className="welcome-content">
                              <div className="welcome-icon">
                                <i className="fa-solid fa-comments"></i>
                              </div>
                              <h4>
                                {AI_ASSISTANT_ENABLED
                                  ? "Benvenuto nell'AI Assistant!"
                                  : "AI Assistant Non Disponibile"}
                              </h4>
                              <p className="text-muted">
                                {AI_ASSISTANT_ENABLED
                                  ? "Sono qui per aiutarti con informazioni, supporto tecnico e analisi. Cosa vorresti sapere?"
                                  : "L'assistente AI è temporaneamente disattivato. Tutte le funzionalità sono momentaneamente non disponibili."}
                              </p>
                              {AI_ASSISTANT_ENABLED && (
                                <div className="quick-actions">
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() =>
                                      handleSendQuestion(
                                        "Come posso aiutarti oggi?"
                                      )
                                    }
                                  >
                                    <i className="fa-solid fa-question-circle me-1"></i>
                                    Supporto Generale
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() =>
                                      handleSendQuestion(
                                        "Informazioni sui servizi"
                                      )
                                    }
                                  >
                                    <i className="fa-solid fa-info-circle me-1"></i>
                                    Info Servizi
                                  </button>
                                  <button
                                    className="btn btn-outline-success btn-sm"
                                    onClick={() =>
                                      handleSendQuestion(
                                        "Suggerimenti operativi"
                                      )
                                    }
                                  >
                                    <i className="fa-solid fa-lightbulb me-1"></i>
                                    Suggerimenti
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="ai-messages">
                            {aiMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`ai-message ${msg.type}`}
                              >
                                <div className="message-content">
                                  <div className="message-header">
                                    <span className="sender">
                                      {msg.type === "user" ? (
                                        <>
                                          <i className="fa-solid fa-user"></i>{" "}
                                          Tu
                                        </>
                                      ) : (
                                        <>
                                          <i className="fa-solid fa-robot"></i>{" "}
                                          AI Assistant
                                        </>
                                      )}
                                    </span>
                                    <span className="timestamp">
                                      {msg.timestamp.toLocaleTimeString(
                                        "it-IT",
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        }
                                      )}
                                    </span>
                                  </div>
                                  <div className="message-text">
                                    {msg.message}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {isAiTyping && AI_ASSISTANT_ENABLED && (
                              <div className="ai-message ai">
                                <div className="message-content">
                                  <div className="message-header">
                                    <span className="sender">
                                      <i className="fa-solid fa-robot"></i> AI
                                      Assistant
                                    </span>
                                  </div>
                                  <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Input Container */}
                      <div className="ai-input-container">
                        <div className="ai-input-wrapper">
                          <textarea
                            className="ai-input"
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                              AI_ASSISTANT_ENABLED
                                ? "Scrivi la tua domanda qui..."
                                : "AI Assistant non disponibile"
                            }
                            rows={2}
                            disabled={!AI_ASSISTANT_ENABLED || isAiTyping}
                          />
                          <button
                            className="ai-send-btn"
                            onClick={() => handleSendQuestion()}
                            disabled={
                              !AI_ASSISTANT_ENABLED ||
                              !currentQuestion.trim() ||
                              isAiTyping
                            }
                          >
                            <i className="fa-solid fa-paper-plane"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
