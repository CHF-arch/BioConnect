import { useTheme } from '../../context/ThemeContext';
import { PiSun, PiMoon } from "react-icons/pi";
import styles from './ThemeButton.module.css';

export default function ThemeButton() {
  const { theme, toggleTheme, isPending } = useTheme();

  return (
    <button 
      onClick={toggleTheme} 
      disabled={isPending}
      className={styles.themeButton}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className={styles.iconWrapper} key={theme}>
        {theme === 'light' ? <PiMoon /> : <PiSun />}
      </span>
    </button>
  );
}