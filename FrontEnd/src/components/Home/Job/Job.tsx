import { useEffect, useState } from "react";
import { Modal } from "../../Modal/Modal";
import styles from "./Job.module.css";
import { JobModalForm } from "./ModalForm";
import type { Job } from "../../../types/JobTypes";
import { getJobs, createJob, deleteJob, updateJob } from "../../../api/Job";
export const Jobs = ({ profile_id }: { profile_id: string }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (profile_id) {
      const fetchJobs = async () => {
        try {
          const jobs = await getJobs(profile_id);
          setJobs(Array.isArray(jobs) ? jobs : []);
        } catch (error) {
          setError("Failed to fetch jobs");
          setJobs([]);
        } finally {
          setLoading(false);
        }
      };
      fetchJobs();
    }
  }, [profile_id]);
  const handleAddJob = async (job: Job) => {
    try {
      const newJob = await createJob(job);

      if (!newJob) {
        throw new Error("Invalid response from server");
      }

      setJobs([...jobs, newJob]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating job:", error);
      setError(
        `Failed to add job: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleSubmit = async (formData: {
    title: string;
    description: string;
    appear: boolean;
  }) => {
    if (!profile_id) return;

    const newJob = {
      title: formData.title,
      description: formData.description,
      appear: formData.appear,
    } as Job;

    await handleAddJob(newJob as Job);
  };

  const handleDeleteJob = async (id: number) => {
    try {
      await deleteJob(id);
      setJobs(jobs.filter((job) => job.id !== id));
    } catch (error) {
      setError("Failed to delete job");
    }
  };
  const handleEditJob = async (job: Job) => {
    try {
      await updateJob(job);
      setJobs(jobs.map((j) => (j.id === job.id ? job : j)));
    } catch (error) {
      setError("Failed to edit job");
    }
  };

  return (
    <div className={styles.jobsContainer}>
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.jobsList}>
          <h2 className={styles.sectionTitle}>Jobs</h2>
          <button
            className={styles.addButton}
            onClick={() => setIsModalOpen(true)}>
            + Add Job
          </button>
          {jobs
            .filter((job) => job != null)
            .map((job: Job) => (
              <div key={String(job?.id)} className={styles.jobItem}>
                <h3>{job?.title || "Untitled"}</h3>
                <p>{job?.description || ""}</p>
                <div className={styles.jobActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEditJob(job)}>
                    Edit
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteJob(job?.id || 0)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        title="Add New Job"
        size="medium">
        <JobModalForm onSubmit={handleSubmit} setIsModalOpen={setIsModalOpen} />
      </Modal>
    </div>
  );
};
