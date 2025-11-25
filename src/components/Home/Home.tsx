import { useEffect, useState, useRef } from "react";
import { dataService } from "../../api/DataService";
import { useAuthStore } from "../../store/useAuthStore";
import type { Profile, Project } from "../../types/DatabaseTypes";
import styles from "./Home.module.css";
import { IoPersonSharp } from "react-icons/io5";
import LeftView from "./LeftView/LeftView";

export default function Home() {
  const session = useAuthStore((state) => state.session);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const userId = session?.user?.id;
      if (!userId) return;

      if (fetchedForUserRef.current === userId) return;
      fetchedForUserRef.current = userId;

      try {
        setLoading(true);
        const [profileData, projectsData] = await Promise.all([
          dataService.getProfile(userId),
          dataService.getProjects(userId),
        ]);

        if (!profileData) {
          const newProfile = {
            id: userId,
            FirstName: session.user.user_metadata?.display_name || "New",
            LastName: "User",
          };

          const createdProfile = await dataService.upsertProfile(newProfile);
          setProfile(createdProfile);
        } else {
          setProfile(profileData);
        }

        setProjects(projectsData);
      } catch (error) {
        console.error("Error loading data:", error);
        fetchedForUserRef.current = null;
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session?.user?.id]);

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      {/* Left Side - Editor */}
      <LeftView
        profile={profile}
        projects={projects}
        onProfileUpdate={handleProfileUpdate}
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
              {projects.map((project) => (
                <div key={project.id} className={styles.previewProjectCard}>
                  <h4>{project.title}</h4>
                  <p>{project.description}</p>
                  {project.project_link && (
                    <a
                      href={project.project_link}
                      className={styles.previewLink}>
                      View Project →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
