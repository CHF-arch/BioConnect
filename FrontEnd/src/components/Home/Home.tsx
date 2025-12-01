import { useEffect, useState } from "react";
import type { Profile } from "../../types/DatabaseTypes";
import styles from "./Home.module.css";
import { IoPersonSharp } from "react-icons/io5";
import LeftView from "./LeftView/LeftView";
import { useAuth } from "../../context/AuthContext";
import { getProfile } from "../../api/Profile/Profile";

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const testProfile = async () => {
      if (user?.sub) {
        try {
          const profile = await getProfile();
          setProfile(profile);
          console.log("Profile:", profile);
        } catch (error) {
          console.error("Error:", error);
        }
      }
    };
    testProfile();
  }, [user]);

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  return (
    <div className={styles.container}>
      {/* Left Side - Editor */}
      <LeftView
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
        projects={[]}
      />

      {/* Right Side - Phone Preview */}
      <div className={styles.previewPanel}>
        <div className={styles.previewHeader}>
          <h2>Preview</h2>
          <span className={styles.previewSubtitle}>
            How customers will see your profile
          </span>
        </div>

        <div className={styles.phoneFrame}>
          <div className={styles.phoneNotch}></div>
          <div className={styles.phoneContent}>
            <div className={styles.previewProfile}>
              <div className={styles.previewAvatarWrapper}>
                {profile?.avatar_url ? (
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

            <div className={styles.previewProjects}>
              <h3 className={styles.previewSectionTitle}>Projects</h3>
              <p>No projects available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
