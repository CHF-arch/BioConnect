import { useAuth } from "../../context/AuthContext";
import styles from "./Auth.module.css";

export default function Auth() {
  const { loginWithRedirect, isLoading } = useAuth();

  if (isLoading) {
    return <div className={styles.authContainer}>Loading...</div>;
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h3 className={styles.authTitle}>Welcome to BioConnect</h3>
        <p style={{ marginBottom: "2rem", color: "var(--text-secondary)" }}>
          Sign in to continue
        </p>
        <button className={styles.authButton} onClick={loginWithRedirect}>
          Log In with Auth0
        </button>
      </div>
    </div>
  );
}
