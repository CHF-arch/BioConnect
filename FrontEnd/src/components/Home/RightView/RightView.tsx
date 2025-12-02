import styles from "./RightView.module.css";
import type { Profile } from "../../../types/ProfileTypes";
import { IoPersonSharp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function RightView({
  profile,
}: {
  profile: Profile | undefined;
}) {
  const navigate = useNavigate();
  const handlePublicLink = () => {
    navigate(`/profile/${profile?.id}`);
  };
  return (
    <div>
      <div className={styles.phoneFrame}>
        <div className={styles.phoneNotch}></div>
        <div className={styles.phoneContent}>
          <div className={styles.previewProfile}>
            <div className={styles.previewAvatarWrapper}>
              {profile && profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className={styles.previewAvatar}
                />
              ) : (
                <div className={styles.previewAvatarPlaceholder}>
                  <IoPersonSharp size={40} />
                </div>
              )}
            </div>
            <h2 className={styles.previewName}>
              {profile?.FirstName} {profile?.LastName}
            </h2>
          </div>
        </div>
      </div>
      <div className={styles.previewLinkContainer}>
        <button onClick={handlePublicLink} className={styles.previewLinkButton}>
          Public Link
        </button>
      </div>
    </div>
  );
}
