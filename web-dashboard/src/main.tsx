import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/* Simple error boundary so render crashes show a useful message */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0A0E17",
            color: "#EF4444",
            display: "grid",
            placeItems: "center",
            fontFamily: "monospace",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>
              💥 PayVerify — Render Error
            </div>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 13,
                background: "#111827",
                padding: 20,
                borderRadius: 8,
                color: "#F87171",
                border: "1px solid #374151",
              }}
            >
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack?.split("\n").slice(0, 10).join("\n")}
            </pre>
            <button
              style={{
                marginTop: 16,
                padding: "10px 20px",
                background: "#F59E0B",
                color: "#0A0E17",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={() => this.setState({ error: null })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
