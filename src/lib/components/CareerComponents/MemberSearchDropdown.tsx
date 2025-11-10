"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface Member {
  _id: string;
  name: string;
  email: string;
  image?: string;
  orgID: string;
}

interface MemberSearchDropdownProps {
  orgID: string;
  onSelectMember: (member: Member) => void;
  selectedMember?: Member | null;
  placeholder?: string;
  excludeMembers?: string[]; // Array of member IDs to exclude
}

export default function MemberSearchDropdown({
  orgID,
  onSelectMember,
  selectedMember,
  placeholder = "Search members by name or email",
  excludeMembers = []
}: MemberSearchDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      if (!orgID) return;
      
      setIsLoading(true);
      try {
        const response = await axios.post("/api/fetch-members", { orgID });
        const allMembers = response.data;
        // Filter out excluded members (by _id or email)
        const availableMembers = allMembers.filter(
          (member: Member) => !excludeMembers.includes(member._id) && !excludeMembers.includes(member.email)
        );
        setMembers(availableMembers);
        setFilteredMembers(availableMembers);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [orgID, excludeMembers]);

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(
      (member) =>
        member.name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
    );
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSelectMember = (member: Member) => {
    onSelectMember(member);
    setDropdownOpen(false);
    setSearchQuery("");
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="dropdown w-100" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        className="dropdown-btn fade-in-bottom"
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px"
        }}
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
      >
        {selectedMember ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {selectedMember.image ? (
              <img
                src={selectedMember.image}
                alt={selectedMember.name}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  objectFit: "cover"
                }}
              />
            ) : (
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: "600"
                }}
              >
                {getInitials(selectedMember.name)}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>{selectedMember.name}</span>
              <span style={{ fontSize: "12px", color: "#6B7280" }}>{selectedMember.email}</span>
            </div>
          </div>
        ) : (
          <span style={{ color: "#9CA3AF" }}>{placeholder}</span>
        )}
        <i className="la la-angle-down ml-10"></i>
      </button>

      <div
        className={`dropdown-menu w-100 mt-1 org-dropdown-anim${dropdownOpen ? " show" : ""}`}
        style={{
          padding: "10px",
          maxHeight: 300,
          overflowY: "auto",
          position: "absolute",
          zIndex: 1000
        }}
      >
        {/* Search Input */}
        <div style={{ marginBottom: "10px", position: "sticky", top: 0, background: "white", paddingBottom: "8px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "14px",
              border: "1px solid #D1D5DB",
              borderRadius: "6px"
            }}
          />
        </div>

        {/* Members List */}
        {isLoading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
            Loading members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#6B7280" }}>
            {searchQuery ? "No members found" : "No members available"}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <button
              key={member._id}
              className="dropdown-item"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                background: selectedMember?._id === member._id ? "#F3F4F6" : "transparent",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                marginBottom: "4px",
                transition: "background 0.2s"
              }}
              onClick={() => handleSelectMember(member)}
              onMouseEnter={(e) => {
                if (selectedMember?._id !== member._id) {
                  e.currentTarget.style.background = "#F9FAFB";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMember?._id !== member._id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "600",
                    flexShrink: 0
                  }}
                >
                  {getInitials(member.name)}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1, overflow: "hidden" }}>
                <span style={{ fontWeight: 600, fontSize: "14px", color: "#181D27", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  {member.name}
                </span>
                <span style={{ fontSize: "12px", color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  {member.email}
                </span>
              </div>
              {selectedMember?._id === member._id && (
                <i
                  className="la la-check"
                  style={{
                    fontSize: "20px",
                    background: "linear-gradient(180deg, #9FCAED 0%, #CEB6DA 33%, #EBACC9 66%, #FCCEC0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                    flexShrink: 0
                  }}
                ></i>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
