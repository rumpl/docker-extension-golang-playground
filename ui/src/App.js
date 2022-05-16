import React from "react";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CssBaseline from "@mui/material/CssBaseline";
import { DockerMuiThemeProvider } from "@docker/docker-mui-theme";
import Editor from "@monaco-editor/react";
import { createDockerDesktopClient } from "@docker/extension-api-client";

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

function App() {
  const [responses, setResponses] = React.useState([]);
  const [errors, setErrors] = React.useState("");
  const ddClient = useDockerDesktopClient();
  const editorRef = React.useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const run = async () => {
    const code = editorRef.current.getValue();
    const result = await ddClient.extension.vm.service.post("/compile", {
      code,
    });
    setResponses(result.Events);
    setErrors(result.Errors);
  };

  return (
    <DockerMuiThemeProvider>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            Golang playground
          </Typography>
        </Toolbar>
      </AppBar>
      <div>
        <Editor
          theme="vs-dark"
          height="70vh"
          defaultLanguage="go"
          defaultValue={`package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello Docker Extension")\n}\n`}
          onMount={handleEditorDidMount}
        />
        <Button onClick={run}>Run</Button>
      </div>
      <div>
        {responses &&
          responses.map((response) => (
            <pre key={response.Message}>{response.Message}</pre>
          ))}
      </div>
      {errors && (
        <pre style={{ color: "red" }} key={errors}>
          {errors}
        </pre>
      )}
    </DockerMuiThemeProvider>
  );
}

export default App;
