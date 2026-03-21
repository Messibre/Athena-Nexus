import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import { changePassword, fetchMe } from "../redux/thunks/authThunks";
import { updateUserProfile } from "../redux/thunks/usersThunks";
import { selectUser } from "../redux/selectors/authSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";

const Settings = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const theme = useSelector(selectTheme);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileForm, setProfileForm] = useState({
    displayName: "",
    email: "",
    contactEmail: "",
    members: [],
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || "",
        email: user.email || "",
        contactEmail: user.contactEmail || "",
        members: user.members || [],
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await dispatch(
        updateUserProfile({
          id: user._id || user.id,
          payload: {
            displayName: profileForm.displayName,
            email: profileForm.email,
            contactEmail: profileForm.contactEmail,
            members: profileForm.members,
          },
        }),
      ).unwrap();
      await dispatch(fetchMe()).unwrap();
      setSuccess("Profile updated successfully!");
    } catch (error) {
      setError(error || "Failed to update profile");
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
      setError(err || "Failed to change password");
    }

    setLoading(false);
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...profileForm.members];
    if (!newMembers[index]) {
      newMembers[index] = { name: "", role: "", githubUsername: "", email: "" };
    }
    newMembers[index][field] = value;
    setProfileForm({ ...profileForm, members: newMembers });
  };

  const addMember = () => {
    setProfileForm({
      ...profileForm,
      members: [
        ...profileForm.members,
        { name: "", role: "", githubUsername: "", email: "" },
      ],
    });
  };

  const removeMember = (index) => {
    const newMembers = profileForm.members.filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, members: newMembers });
  };

  const panelClass = `rounded-3xl border p-6 md:p-8 shadow-2xl ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`;
  const inputClass = `w-full p-4 rounded-xl border outline-none transition-all ${
    theme === "dark"
      ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
      : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
  }`;
  const labelClass =
    "text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2";

  return (
    <div
      data-theme={theme}
      className={`min-h-screen font-['Space_Grotesk'] ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
    >
      <Navbar />

      <div
        className="bg-image-layer"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url("/pur1.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: theme === "dark" ? 0.4 : 0.85,
          pointerEvents: "none",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-10 md:pt-12 pb-20">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#8b5cf6] mb-2">
            Account Control
          </p>
          <h1
            className={`text-4xl md:text-5xl font-['Fraunces'] font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
          >
            Team Settings
          </h1>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "profile" ? "bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25" : theme === "dark" ? "bg-white/10 text-slate-300 hover:bg-white/15" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "password" ? "bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25" : theme === "dark" ? "bg-white/10 text-slate-300 hover:bg-white/15" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
            onClick={() => setActiveTab("password")}
          >
            Change Password
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {activeTab === "profile" && (
          <div className={panelClass}>
            <h2
              className={`text-3xl font-['Fraunces'] font-black tracking-tight mb-6 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              Update Team Profile
            </h2>
            <form onSubmit={handleProfileUpdate}>
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

              <div className="form-group">
                <label className={labelClass}>Team Members</label>
                {profileForm.members.map((member, index) => (
                  <div
                    key={index}
                    className={`mb-4 p-4 rounded-2xl border ${theme === "dark" ? "border-[#2e1a47] bg-[#0a0514]/60" : "border-slate-200 bg-slate-50/80"}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <strong>Member {index + 1}</strong>
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-500 hover:bg-red-500/25 transition-all"
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
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#8b5cf6]/25 transition-all"
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
              className={`text-3xl font-['Fraunces'] font-black tracking-tight mb-6 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
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
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#8b5cf6]/25 transition-all"
                disabled={loading}
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
