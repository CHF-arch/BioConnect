import { useState } from "react";
import styles from "./Job.module.css";

interface FormData {
  title: string;
  description: string;
  appear: boolean;
}

export const JobModalForm = ({
  onSubmit,
  setIsModalOpen,
}: {
  onSubmit: (formData: FormData) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    appear: true,
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
    onSubmit(formData);
  };

  return (
    <div className={styles.modalForm}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Job Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="Enter job title"
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
            placeholder="Enter job description"
            rows={4}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="appear" className={styles.label}>
            Appear
          </label>
          <input
            type="color"
            id="appear"
            name="appear"
            value={formData.appear ? "true" : "false"}
            onChange={handleInputChange}
            className={styles.checkbox}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(false);
              setFormData({ title: "", description: "", appear: true });
            }}
            className={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" className={styles.saveButton}>
            Save Job
          </button>
        </div>
      </form>
    </div>
  );
};
