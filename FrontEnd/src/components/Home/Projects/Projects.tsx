import { useEffect, useState } from "react";
import type { Project } from "../../../types/ProjectsTypes";
import { getProjects } from "../../../api/Projects/Projects";
import styles from "./Projects.module.css";

export const Projects = ({ profile_id }: { profile_id: string }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile_id) {
      const fetchProjects = async () => {
        try {
          const projects = await getProjects(profile_id);
          setProjects(projects);
        } catch (error) {
          setError("Failed to fetch projects");
        } finally {
          setLoading(false);
        }
      };
      fetchProjects();
    }
  }, [profile_id]);

  return (
    <div className={styles.projectsContainer}>
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.projectsList}>
          {projects.map((project) => (
            <div key={project.id} className={styles.projectItem}>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <a
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer">
                {project.project_url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
