import { useRef, useState } from "react";
import styles from "./LeftView.module.css";
import { FaCheck, FaTimes, FaSave, FaEdit, FaCamera } from "react-icons/fa";
import { IoPersonSharp } from "react-icons/io5";
import type { Profile, Project } from "../../../types/DatabaseTypes";
import { dataService } from "../../../api/DataService";

interface LeftViewProps {
  profile: Profile | null;
  projects: Project[];
  onProfileUpdate: (profile: Profile) => void;
}

export default function LeftView({
  profile,
  projects,
  onProfileUpdate,
}: LeftViewProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [firstName, setFirstName] = useState<string>(profile?.FirstName || "");
  const [lastName, setLastName] = useState<string>(profile?.LastName || "");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingLastName, setIsEditingLastName] = useState<boolean>(false);

  const isEditing = isEditingName || isEditingLastName;
  const hasChanges =
    (profile && firstName !== profile.FirstName) ||
    (profile && lastName !== profile.LastName);

  const handleCancelEdit = () => {
    // Revert changes
    if (profile) {
      setFirstName(profile.FirstName);
      setLastName(profile.LastName);
    }
    setIsEditingName(false);
    setIsEditingLastName(false);
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      const updates: Partial<Profile> = {};

      if (firstName !== profile.FirstName) {
        updates.FirstName = firstName;
      }
      if (lastName !== profile.LastName) {
        updates.LastName = lastName;
      }

      if (Object.keys(updates).length > 0) {
        const updatedProfile = await dataService.updateProfile(
          profile.id,
          updates
        );
        onProfileUpdate(updatedProfile);

        // Show success message
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }

      // Exit edit mode
      setIsEditingName(false);
      setIsEditingLastName(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    try {
      setUploadingAvatar(true);

      // Delete old avatar if exists
      if (profile.avatar_url) {
        await dataService.deleteAvatar(profile.avatar_url).catch(console.error);
      }

      // Upload new avatar
      const avatarUrl = await dataService.uploadAvatar(profile.id, file);

      // Update profile with new avatar URL
      const updatedProfile = await dataService.updateProfile(profile.id, {
        avatar_url: avatarUrl,
      });

      onProfileUpdate(updatedProfile);

      // Show success
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={styles.editorPanel}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Edit Your Profile</h1>

        {saveSuccess && (
          <div className={styles.successBadge}>
            <FaCheck /> Saved!
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Profile Information</h2>

          {isEditing && (
            <div className={styles.actionButtons}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelEdit}
                disabled={saving}>
                <FaTimes /> Cancel
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSaveProfile}
                disabled={saving || !hasChanges}>
                <FaSave /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <IoPersonSharp size={48} />
              </div>
            )}
            <div className={styles.avatarOverlay}>
              <FaCamera size={24} />
            </div>
            {uploadingAvatar && (
              <div className={styles.avatarLoading}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>
          <button
            className={styles.uploadButton}
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}>
            {uploadingAvatar ? "Uploading..." : "Upload Photo"}
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>First Name</label>
          <div className={styles.inputWrapper}>
            <IoPersonSharp className={styles.inputIcon} />
            <input
              type="text"
              className={`${styles.input} ${isEditingName ? styles.inputEditing : ""}`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isEditingName}
              placeholder="Enter first name"
            />
            {!isEditingName && (
              <FaEdit
                className={styles.editIcon}
                onClick={() => setIsEditingName(true)}
              />
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Last Name</label>
          <div className={styles.inputWrapper}>
            <IoPersonSharp className={styles.inputIcon} />
            <input
              type="text"
              className={`${styles.input} ${isEditingLastName ? styles.inputEditing : ""}`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!isEditingLastName}
              placeholder="Enter last name"
            />
            {!isEditingLastName && (
              <FaEdit
                className={styles.editIcon}
                onClick={() => setIsEditingLastName(true)}
              />
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Projects</h2>
        <button className={styles.addButton}>+ Add Project</button>

        <div className={styles.projectsList}>
          {projects.map((project) => (
            <div key={project.id} className={styles.projectItem}>
              <div className={styles.projectInfo}>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </div>
              <button className={styles.editButton}>
                <FaEdit />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
