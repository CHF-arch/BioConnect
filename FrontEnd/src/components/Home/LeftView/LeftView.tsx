import { useRef, useState, useEffect } from "react";
import styles from "./LeftView.module.css";
import {
  FaCheck,
  FaTimes,
  FaSave,
  FaEdit,
  FaCamera,
  FaTrash,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";
import { IoPersonSharp } from "react-icons/io5";
import { DeleteProfile } from "../../../api/Profile/Profile";
import { uploadAvatar } from "../../../api/Profile/Profile";
import { updateProfile } from "../../../api/Profile/Profile";
import type { Profile } from "../../../types/ProfileTypes";
import { Projects } from "../Projects/Projects";

interface LeftViewProps {
  profile: Profile | null;
  onProfileUpdate: (profile: Profile) => void;
}

export default function LeftView({ profile, onProfileUpdate }: LeftViewProps) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.FirstName || "");
      setLastName(profile.LastName || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFirstName(profile.FirstName || "");
      setLastName(profile.LastName || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);
      const updates: Partial<Profile> = {};

      if (profile.FirstName !== firstName) {
        updates.FirstName = firstName;
      }
      if (profile.LastName !== lastName) {
        updates.LastName = lastName;
      }
      if ((profile.email || "") !== email) {
        updates.email = email;
      }
      if ((profile.phone || "") !== phone) {
        updates.phone = phone;
      }

      if (Object.keys(updates).length > 0) {
        const fullUpdate: Partial<Profile> = {
          FirstName: firstName,
          LastName: lastName,
          email: email,
          phone: phone,
          avatar_url: profile.avatar_url || undefined,
        };

        const updatedProfile = await updateProfile(profile.id, fullUpdate);
        onProfileUpdate(updatedProfile);

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }

      setIsEditing(false);
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

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    try {
      setUploadingAvatar(true);

      const response = await uploadAvatar(profile.id, file);

      const avatarUrl = response.avatarUrl || response.avatar_url;

      if (!avatarUrl) {
        throw new Error("Avatar URL not returned from server");
      }

      const updatedProfile = await updateProfile(profile.id, {
        FirstName: profile.FirstName || "",
        LastName: profile.LastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        avatar_url: avatarUrl,
      });

      onProfileUpdate(updatedProfile);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteProfile = async () => {
    if (!profile?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your profile? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await DeleteProfile(profile.id);
      alert("Profile deleted successfully");
    } catch (error) {
      console.error("Error deleting profile:", error);
      alert("Failed to delete profile. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.editorPanel}>
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

          {!isEditing ? (
            <button className={styles.editButton} onClick={handleStartEdit}>
              <FaEdit /> Edit
            </button>
          ) : (
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
                disabled={saving}>
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
              className={`${styles.input} ${isEditing ? styles.inputEditing : ""}`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isEditing}
              placeholder="Enter first name"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Last Name</label>
          <div className={styles.inputWrapper}>
            <IoPersonSharp className={styles.inputIcon} />
            <input
              type="text"
              className={`${styles.input} ${isEditing ? styles.inputEditing : ""}`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!isEditing}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <div className={styles.inputWrapper}>
            <FaEnvelope className={styles.inputIcon} />
            <input
              type="email"
              className={`${styles.input} ${isEditing ? styles.inputEditing : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
              placeholder="Enter email"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Phone</label>
          <div className={styles.inputWrapper}>
            <FaPhone className={styles.inputIcon} />
            <input
              type="tel"
              className={`${styles.input} ${isEditing ? styles.inputEditing : ""}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditing}
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <button
            className={styles.deleteButton}
            onClick={handleDeleteProfile}
            disabled={deleting}>
            <FaTrash /> {deleting ? "Deleting..." : "Delete Profile"}
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Projects</h2>
        <button className={styles.addButton}>+ Add Project</button>

        <div className={styles.projectsList}>
          <Projects profile_id={profile?.id as string} />
        </div>
      </div>
    </div>
  );
}
