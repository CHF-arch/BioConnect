import { useEffect, useState } from "react";
import styles from "./Projects.module.css";
import { getProjectById, updateProject } from "../../../api/Projects";
import type { Project } from "../../../Types/ProfileTypes";
export const ModalEditForm = ({
  setIsModalOpen,
  projectId,
}: {
  setIsModalOpen: (isOpen: boolean) => void;
  projectId: number;
}) => {
  const [formData, setFormData] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      const project = await getProjectById(projectId);
      setFormData(project);
    };
    fetchProject();
    console.log(fetchProject);
  }, [projectId]);
  console.log(formData);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: Project | null) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value as string,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject(formData as Project);
  };

  return (
    <div className={styles.modalForm}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData?.title || ""}
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData?.description || ""}
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="project_link" className={styles.label}>
            Project Link
          </label>
          <input
            type="text"
            id="project_link"
            name="project_link"
            value={formData?.project_link || ""}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          Save
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => setIsModalOpen(false)}>
          Cancel
        </button>
      </form>
    </div>
  );
};
