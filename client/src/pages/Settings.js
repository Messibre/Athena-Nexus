import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import { changePassword, fetchMe } from "../redux/thunks/authThunks";
import { updateUserProfile } from "../redux/thunks/usersThunks";
import { selectUser } from "../redux/selectors/authSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";
import MiniModal from "../components/MiniModal";

const emptySocialLinks = {
  website: "",
  github: "",
  linkedin: "",
  x: "",
  instagram: "",
};

const uploadToCloudinary = async (file) => {
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  const isConfigured = Boolean(cloudName && uploadPreset);

  if (!isConfigured) {
    console.error("Cloudinary upload is not configured", {
      hasCloudName: Boolean(cloudName),
      hasUploadPreset: Boolean(uploadPreset),
    });
    throw new Error(
      "We could not upload your image right now. Please check your image settings and try again.",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();
  if (!response.ok) {
    console.error("Cloudinary upload failed", {
      status: response.status,
      response: data,
      cloudName,
      uploadPreset,
    });

    throw new Error(
      "We could not upload your image right now. Please try again in a moment.",
    );
  }

  return data.secure_url;
};

const getErrorMessage = (error, fallback) => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  const status = error?.response?.status;
  if (status === 400)
    return "Please check the details you entered and try again.";
  if (status === 401) return "Your session ended. Please sign in again.";
  if (status === 403) return "You are not allowed to make that change.";
  if (status === 404) return "We couldn't find the item you were looking for.";
  if (status === 409)
    return "That value is already in use. Try a different one.";
  if (status === 422)
    return "Some of the information looks incomplete or invalid.";
  if (status === 429)
    return "You're doing that too quickly. Please wait a moment.";
  if (status >= 500) return "The server had a problem. Please try again soon.";

  return fallback;
};

const Settings = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const theme = useSelector(selectTheme);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalState, setModalState] = useState({
    open: false,
    title: "Notice",
    message: "",
  });

  const [profileForm, setProfileForm] = useState({
    displayName: "",
    email: "",
    contactEmail: "",
    profileImageUrl: "",
    coverImageUrl: "",
    headline: "",
    bio: "",
    location: "",
    socialLinks: emptySocialLinks,
    members: [],
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [coverImagePreview, setCoverImagePreview] = useState("");

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || "",
        email: user.email || "",
        contactEmail: user.contactEmail || "",
        profileImageUrl: user.profileImageUrl || "",
        coverImageUrl: user.coverImageUrl || "",
        headline: user.headline || "",
        bio: user.bio || "",
        location: user.location || "",
        socialLinks: {
          ...emptySocialLinks,
          ...(user.socialLinks || {}),
        },
        members: (user.members || []).map((member) => ({
          name: member.name || "",
          role: member.role || "",
          githubUsername: member.githubUsername || "",
          email: member.email || "",
          bio: member.bio || "",
        })),
      });
      setProfileImageFile(null);
      setCoverImageFile(null);
      setProfileImagePreview(user.profileImageUrl || "");
      setCoverImagePreview(user.coverImageUrl || "");
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      setModalState({
        open: true,
        title: "Settings Error",
        message: error,
      });
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      setModalState({
        open: true,
        title: "Settings Updated",
        message: success,
      });
    }
  }, [success]);

  useEffect(() => {
    const onMobileBack = (event) => {
      if (window.innerWidth >= 768 || activeTab !== "password") {
        return;
      }

      setActiveTab("profile");
      event.preventDefault();
    };

    window.addEventListener("app:mobile-back", onMobileBack);
    return () => window.removeEventListener("app:mobile-back", onMobileBack);
  }, [activeTab]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProfileImageFile(null);
      setProfileImagePreview(profileForm.profileImageUrl || "");
      return;
    }

    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleCoverImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCoverImageFile(null);
      setCoverImagePreview(profileForm.coverImageUrl || "");
      return;
    }

    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      let nextProfileImageUrl = profileForm.profileImageUrl || "";
      let nextCoverImageUrl = profileForm.coverImageUrl || "";

      if (
        !process.env.REACT_APP_CLOUDINARY_CLOUD_NAME ||
        !process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
      ) {
        console.error(
          "Cloudinary environment variables are missing in the client app",
        );
        setError(
          "We could not upload your image right now. Please try again later.",
        );
        return;
      }

      if (profileImageFile) {
        nextProfileImageUrl = await uploadToCloudinary(profileImageFile);
      }

      if (coverImageFile) {
        nextCoverImageUrl = await uploadToCloudinary(coverImageFile);
      }

      await dispatch(
        updateUserProfile({
          id: user._id || user.id,
          payload: {
            displayName: profileForm.displayName,
            email: profileForm.email,
            contactEmail: profileForm.contactEmail,
            profileImageUrl: nextProfileImageUrl,
            coverImageUrl: nextCoverImageUrl,
            headline: profileForm.headline,
            bio: profileForm.bio,
            location: profileForm.location,
            socialLinks: profileForm.socialLinks,
            members: profileForm.members,
          },
        }),
      ).unwrap();
      await dispatch(fetchMe()).unwrap();
      setSuccess("Profile updated successfully!");
    } catch (error) {
      setError(getErrorMessage(error, "Failed to update profile"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const hasLetter = /[A-Za-z]/.test(passwordForm.newPassword);
    const hasNumber = /\d/.test(passwordForm.newPassword);
    if (!hasLetter || !hasNumber) {
      setError("Password must contain both letters and numbers");
      return;
    }

    setLoading(true);

    try {
      await dispatch(
        changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      ).unwrap();
      setSuccess("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to change password"));
    }

    setLoading(false);
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...profileForm.members];
    if (!newMembers[index]) {
      newMembers[index] = {
        name: "",
        role: "",
        githubUsername: "",
        email: "",
        bio: "",
      };
    }
    newMembers[index][field] = value;
    setProfileForm({ ...profileForm, members: newMembers });
  };

  const addMember = () => {
    setProfileForm({
      ...profileForm,
      members: [
        ...profileForm.members,
        {
          name: "",
          role: "",
          githubUsername: "",
          email: "",
          bio: "",
        },
      ],
    });
  };

  const removeMember = (index) => {
    const newMembers = profileForm.members.filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, members: newMembers });
  };

  const panelClass = `rounded-2xl border p-4 md:p-5 shadow-2xl ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`;
  const inputClass = `w-full p-3 rounded-xl border outline-none transition-all ${
    theme === "dark"
      ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
      : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
  }`;
  const labelClass =
    "text-[11px] font-black uppercase tracking-[0.2em] opacity-70 block mb-1.5";
  const textareaClass = `${inputClass} min-h-[100px] resize-y`;

  const renderImagePreview = (preview, label) => {
    if (!preview) {
      return (
        <div
          className={`flex h-36 items-center justify-center rounded-2xl border border-dashed ${theme === "dark" ? "border-[#2e1a47] bg-black/20 text-slate-500" : "border-slate-300 bg-slate-50 text-slate-400"}`}
        >
          {label}
        </div>
      );
    }

    return (
      <img
        src={preview}
        alt={label}
        className="h-36 w-full rounded-2xl object-cover border border-white/10"
      />
    );
  };

  return (
    <div
      data-theme={theme}
      className={`secondary-page-shell min-h-screen font-['Manrope'] ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
    >
      <Navbar />

      <div className="secondary-page-bg-layer" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-10 md:pt-12 pb-20">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#8b5cf6] mb-2">
            Account Control
          </p>
          <h1
            className={`text-xl md:text-2xl font-['Fraunces'] font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
          >
            Team Settings
          </h1>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "profile" ? "bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25" : theme === "dark" ? "bg-white/10 text-slate-300 hover:bg-white/15" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "password" ? "bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25" : theme === "dark" ? "bg-white/10 text-slate-300 hover:bg-white/15" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
            onClick={() => setActiveTab("password")}
          >
            Change Password
          </button>
        </div>

        {activeTab === "profile" && (
          <div className={panelClass}>
            <h2
              className={`text-xl md:text-2xl font-['Fraunces'] font-black tracking-tight mb-5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              Update Team Profile
            </h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <label className={labelClass}>Profile Image</label>
                  {renderImagePreview(
                    profileImagePreview,
                    "Profile image preview",
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className={inputClass}
                    onChange={handleProfileImageChange}
                  />
                </div>

                <div className="space-y-3">
                  <label className={labelClass}>Cover Image</label>
                  {renderImagePreview(coverImagePreview, "Cover image preview")}
                  <input
                    type="file"
                    accept="image/*"
                    className={inputClass}
                    onChange={handleCoverImageChange}
                  />
                </div>
              </div>

              <p className="mb-6 text-xs opacity-60">
                Profile and cover images are uploaded to Cloudinary when you
                save the form.
              </p>

              <div className="form-group">
                <label className={labelClass}>Display Name</label>
                <input
                  type="text"
                  className={inputClass}
                  value={profileForm.displayName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      displayName: e.target.value,
                    })
                  }
                  placeholder="Your team's display name"
                />
              </div>

              <div className="form-group">
                <label className={labelClass}>Headline</label>
                <input
                  type="text"
                  className={inputClass}
                  value={profileForm.headline}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      headline: e.target.value,
                    })
                  }
                  placeholder="Short profile headline"
                />
              </div>

              <div className="form-group">
                <label className={labelClass}>Bio</label>
                <textarea
                  className={textareaClass}
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, bio: e.target.value })
                  }
                  placeholder="Tell people about the team"
                />
              </div>

              <div className="form-group">
                <label className={labelClass}>Location</label>
                <input
                  type="text"
                  className={inputClass}
                  value={profileForm.location}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      location: e.target.value,
                    })
                  }
                  placeholder="City, country, or timezone"
                />
              </div>

              <div className="form-group">
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  placeholder="team@example.com"
                />
              </div>

              <div className="form-group">
                <label className={labelClass}>Contact Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={profileForm.contactEmail}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      contactEmail: e.target.value,
                    })
                  }
                  placeholder="contact@example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className={labelClass}>Website</label>
                  <input
                    type="url"
                    className={inputClass}
                    value={profileForm.socialLinks.website}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        socialLinks: {
                          ...profileForm.socialLinks,
                          website: e.target.value,
                        },
                      })
                    }
                    placeholder="https://your-site.com"
                  />
                </div>
                <div className="form-group">
                  <label className={labelClass}>GitHub</label>
                  <input
                    type="url"
                    className={inputClass}
                    value={profileForm.socialLinks.github}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        socialLinks: {
                          ...profileForm.socialLinks,
                          github: e.target.value,
                        },
                      })
                    }
                    placeholder="https://github.com/your-profile"
                  />
                </div>
                <div className="form-group">
                  <label className={labelClass}>LinkedIn</label>
                  <input
                    type="url"
                    className={inputClass}
                    value={profileForm.socialLinks.linkedin}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        socialLinks: {
                          ...profileForm.socialLinks,
                          linkedin: e.target.value,
                        },
                      })
                    }
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                </div>
                <div className="form-group">
                  <label className={labelClass}>X / Twitter</label>
                  <input
                    type="url"
                    className={inputClass}
                    value={profileForm.socialLinks.x}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        socialLinks: {
                          ...profileForm.socialLinks,
                          x: e.target.value,
                        },
                      })
                    }
                    placeholder="https://x.com/your-profile"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className={labelClass}>Team Members</label>
                {profileForm.members.map((member, index) => (
                  <div
                    key={index}
                    className={`mb-4 p-3 rounded-2xl border ${theme === "dark" ? "border-[#2e1a47] bg-[#0a0514]/60" : "border-slate-200 bg-slate-50/80"}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <strong>Member {index + 1}</strong>
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Name"
                        value={member.name || ""}
                        onChange={(e) =>
                          handleMemberChange(index, "name", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Role (optional)"
                        value={member.role || ""}
                        onChange={(e) =>
                          handleMemberChange(index, "role", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="GitHub Username"
                        value={member.githubUsername || ""}
                        onChange={(e) =>
                          handleMemberChange(
                            index,
                            "githubUsername",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        type="email"
                        className={inputClass}
                        placeholder="Email"
                        value={member.email || ""}
                        onChange={(e) =>
                          handleMemberChange(index, "email", e.target.value)
                        }
                      />
                      <textarea
                        className={`${textareaClass} md:col-span-2`}
                        placeholder="Member bio"
                        value={member.bio || ""}
                        onChange={(e) =>
                          handleMemberChange(index, "bio", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMember}
                  className="mb-4 px-4 py-2 rounded-xl border border-[#8b5cf6] text-[#8b5cf6] text-xs font-black uppercase tracking-wider bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 transition-all"
                >
                  + Add Member
                </button>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-[#8b5cf6]/25 transition-all"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "password" && (
          <div className={panelClass}>
            <h2
              className={`text-xl md:text-2xl font-['Fraunces'] font-black tracking-tight mb-5 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              Change Password
            </h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className={labelClass}>Current Password</label>
                <input
                  type="password"
                  className={inputClass}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  className={inputClass}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  placeholder="8+ characters, letters + numbers"
                />
                <small className="opacity-60 text-xs">
                  8+ characters, must include letters and numbers
                </small>
              </div>

              <div className="form-group">
                <label className={labelClass}>Confirm New Password</label>
                <input
                  type="password"
                  className={inputClass}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-[#8b5cf6]/25 transition-all"
                disabled={loading}
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        )}
      </div>

      <MiniModal
        open={modalState.open}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default Settings;
