import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_4TftlWzgP",
  client_id: "7rfb69gglntu7klpdq77i9asau",
  //redirect_uri: "https://www.medportal.lol/auth/callback", // Updated callback route
  redirect_uri: "http://localhost:3000/auth/callback", // Updated callback route
  response_type: "code",
  scope: "email openid phone",
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider
        {...cognitoAuthConfig}
        onSigninCallback={() => {
          // Clear URL state and redirect to the dashboard after sign-in
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.href = "/dashboard";
        }}
      >
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
