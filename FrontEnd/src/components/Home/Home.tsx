import { useEffect, useState } from "react";
import type { Profile } from "../../types/ProfileTypes";
import styles from "./Home.module.css";
import LeftView from "./LeftView/LeftView";
import { useAuth } from "../../context/AuthContext";
import { getProfile } from "../../api/Profile/Profile";
import RightView from "./RightView/RightView";

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | undefined>(undefined);

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
      <LeftView
        profile={profile || null}
        onProfileUpdate={handleProfileUpdate}
      />

      <div className={styles.previewPanel}>
        <div className={styles.previewHeader}>
          <h2>Preview</h2>
          <span className={styles.previewSubtitle}>
            How customers will see your profile
          </span>
        </div>

        <RightView profile={profile} />
      </div>
    </div>
  );
}
