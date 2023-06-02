import { useNotifications } from "~/contexts/Notifications";

import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const Notifications = () => {
  const {
    isPingLogoutSessionExpiry,
    isPingInvalidStartSession,
    setIsPingLogoutSessionExpiry,
    setIsPingInvalidStartSession,
  } = useNotifications();
  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={isPingLogoutSessionExpiry}
        onClose={() => setIsPingLogoutSessionExpiry(false)}
        message="Session expired. Please login again."
        key="session_expired"
      />

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={isPingInvalidStartSession}
        onClose={() => setIsPingInvalidStartSession(false)}
        // message="Error starting livestream session, please reload."
        key="invalid_session"
      >
        <Alert severity="error">
          Error starting livestream session, please reload.
        </Alert>
      </Snackbar>
    </>
  );
};

export default Notifications;
