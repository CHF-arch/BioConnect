import { useState } from "react";
import styles from "./Projects.module.css";

export interface FormData {
  title: string;
  description: string;
  project_link: string;
}

export const ModalForm = ({
  onSubmit,
  setIsModalOpen,
}: {
  onSubmit: (formData: FormData) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    project_link: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData); // ✅ Pass formData to parent
  };

  return (
    <div className={styles.modalForm}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Project Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="Enter project title"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={styles.textarea}
            placeholder="Enter project description"
            rows={4}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="project_link" className={styles.label}>
            Project URL
          </label>
          <input
            type="url"
            id="project_link"
            name="project_link"
            value={formData.project_link}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="https://example.com"
            required
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(false);
              setFormData({ title: "", description: "", project_link: "" });
            }}
            className={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" className={styles.saveButton}>
            Save Project
          </button>
        </div>
      </form>
    </div>
  );
};
