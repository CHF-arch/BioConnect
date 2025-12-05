import styles from "./RightView.module.css";
import { IoPersonSharp } from "react-icons/io5";
import { FaEnvelope, FaPhone, FaExternalLinkAlt } from "react-icons/fa";
import { SiGithub, SiX } from "react-icons/si";
import {
  FaLinkedin,
  FaTiktok,
  FaDiscord,
  FaFacebook,
  FaInstagram,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getJobs } from "../../../api/Job";
import { getServices } from "../../../api/Services";
import { getProjects } from "../../../api/Projects";
import { getSocialLinks } from "../../../api/SocialLinks";
import type { Profile } from "../../../Types/ProfileTypes";
import type { Job } from "../../../types/JobTypes";
import type { Service } from "../../../types/ServicesTypes";
import type { Project } from "../../../types/ProjectsTypes";
import type { SocialLinksTypes } from "../../../types/SocialLinksTypes";

const PlatformIcons: Record<string, React.ReactNode> = {
  GitHub: <SiGithub />,
  LinkedIn: <FaLinkedin />,
  TikTok: <FaTiktok />,
  Discord: <FaDiscord />,
  Facebook: <FaFacebook />,
  Instagram: <FaInstagram />,
  X: <SiX />,
};

export default function RightView({
  profile,
}: {
  profile: Profile | undefined;
}) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinksTypes[]>([]);

  useEffect(() => {
    if (profile?.id) {
      fetchAllData();
    }
  }, [profile?.id]);

  const fetchAllData = async () => {
    if (!profile?.id) return;

    try {
      const [jobsData, servicesData, projectsData, socialLinksData] =
        await Promise.all([
          getJobs(profile.id),
          getServices(profile.id),
          getProjects(profile.id),
          getSocialLinks(profile.id),
        ]);

      setJobs(jobsData);
      setServices(servicesData);
      setProjects(projectsData);
      setSocialLinks(socialLinksData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handlePublicLink = () => {
    navigate(`/profile/${profile?.id}`);
  };

  return (
    <div>
      <div className={styles.phoneFrame}>
        <div className={styles.phoneNotch}></div>
        <div className={styles.phoneContent}>
          <div className={styles.profileCard}>
            <div className={styles.banner}></div>

            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                {profile && profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.FirstName} ${profile.LastName}`}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <IoPersonSharp size={48} />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.profileInfo}>
              <h1 className={styles.name}>
                {profile?.FirstName || "John"} {profile?.LastName || "Doe"}
              </h1>

              {jobs.length > 0 && (
                <p className={styles.title}>
                  {jobs.map((job) => job.title).join(" • ")}
                </p>
              )}

              <div className={styles.contactInfo}>
                {profile?.email && (
                  <div className={styles.contactItem}>
                    <FaEnvelope className={styles.contactIcon} />
                    <span className={styles.contactText}>{profile.email}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className={styles.contactItem}>
                    <FaPhone className={styles.contactIcon} />
                    <span className={styles.contactText}>{profile.phone}</span>
                  </div>
                )}
              </div>

              {socialLinks.length > 0 && (
                <div className={styles.socialLinks}>
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                      title={link.platform}>
                      {PlatformIcons[link.platform] || <FaExternalLinkAlt />}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {services.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Services</h2>
                <div className={styles.servicesList}>
                  {services.map((service) => (
                    <div key={service.id} className={styles.serviceItem}>
                      <h3 className={styles.itemTitle}>{service.title}</h3>
                      {service.description && (
                        <p className={styles.itemDescription}>
                          {service.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Projects</h2>
                <div className={styles.projectsList}>
                  {projects.map((project) => (
                    <div key={project.id} className={styles.projectItem}>
                      <div className={styles.projectHeader}>
                        <h3 className={styles.itemTitle}>{project.title}</h3>
                        {project.project_link && (
                          <a
                            href={project.project_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.projectLink}>
                            <FaExternalLinkAlt />
                          </a>
                        )}
                      </div>
                      {project.description && (
                        <p className={styles.itemDescription}>
                          {project.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.previewLinkContainer}>
        <button onClick={handlePublicLink} className={styles.previewLinkButton}>
          View Public Profile
        </button>
      </div>
    </div>
  );
}
