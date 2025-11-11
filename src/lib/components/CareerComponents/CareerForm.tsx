"use client"

import React, { useEffect, useRef, useState } from "react";
import InterviewQuestionGeneratorV2 from "./InterviewQuestionGeneratorV2";
import RichTextEditor from "@/lib/components/CareerComponents/RichTextEditor";
import CustomDropdown from "@/lib/components/CareerComponents/CustomDropdown";
import ProgressStepBar from "@/lib/components/CareerComponents/ProgressStepBar";
import philippineCitiesAndProvinces from "../../../../public/philippines-locations.json";
import { candidateActionToast, errorToast } from "@/lib/Utils";
import { useAppContext } from "@/lib/context/AppContext";
import axios from "axios";
import CareerActionModal from "./CareerActionModal";
import FullScreenLoadingAnimation from "./FullScreenLoadingAnimation";
import SimpleTextEditor from "./SimpleTextEditor";
import QuestionFormField from "./QuestionFormField";
import SalaryRangeInput from "./SalaryRangeInput";
import MemberSearchDropdown from "./MemberSearchDropdown";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// Setting List icons
const screeningSettingList = [
  {
    name: "Good Fit and above",
    icon: "la la-check",
  },
  {
    name: "Only Strong Fit",
    icon: "la la-check-double",
  },
  {
    name: "No Automatic Promotion",
    icon: "la la-times",
  },
];
const workSetupOptions = [
  {
    name: "Fully Remote",
  },
  {
    name: "Onsite",
  },
  {
    name: "Hybrid",
  },
];

const employmentTypeOptions = [
  {
    name: "Full-Time",
  },
  {
    name: "Part-Time",
  },
];

const roleOptions = [
  {
    name: "Job Owner",
    description: "Leads the hiring process for assigned jobs. Has access with all career settings.",
  },
  {
    name: "Contributor",
    description: "Helps evaluate candidates and assist with hiring tasks. Can move candidates through the pipeline, but cannot change any career settings.",
  },
  {
    name: "Reviewer",
    description: "Reviews candidates and provides feedback. Can only view candidate profiles and comments.",
  },
];

// Sortable Item Wrapper Component
function SortableItem({ id, children }: { id: string, children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandleProps = { ...attributes, ...listeners };

  return (
    <div ref={setNodeRef} style={style}>
      {React.cloneElement(children as React.ReactElement<any>, {
        dragHandleProps
      })}
    </div>
  );
}

export default function CareerForm({ career, formType, setShowEditModal }: { career?: any, formType: string, setShowEditModal?: (show: boolean) => void }) {
  const { user, orgID } = useAppContext();
  const [jobTitle, setJobTitle] = useState(career?.jobTitle || "");
  const [description, setDescription] = useState(career?.description || "");
  const [workSetup, setWorkSetup] = useState(career?.workSetup || "");
  const [workSetupRemarks, setWorkSetupRemarks] = useState(career?.workSetupRemarks || "");
  const [screeningSetting, setScreeningSetting] = useState(career?.screeningSetting || "Good Fit and above");
  const [employmentType, setEmploymentType] = useState(career?.employmentType || "");
  const [requireVideo, setRequireVideo] = useState(career?.requireVideo || true);
  const [salaryNegotiable, setSalaryNegotiable] = useState(career?.salaryNegotiable || true);
  const [minimumSalary, setMinimumSalary] = useState(career?.minimumSalary || "");
  const [maximumSalary, setMaximumSalary] = useState(career?.maximumSalary || "");
  const [questions, setQuestions] = useState(career?.questions || [
    {
      id: 1,
      category: "CV Validation / Experience",
      questionCountToAsk: null,
      questions: [],
    },
    {
      id: 2,
      category: "Technical",
      questionCountToAsk: null,
      questions: [],
    },
    {
      id: 3,
      category: "Behavioral",
      questionCountToAsk: null,
      questions: [],
    },
    {
      id: 4,
      category: "Analytical",
      questionCountToAsk: null,
      questions: [],
    },
    {
      id: 5,
      category: "Others",
      questionCountToAsk: null,
      questions: [],
    },
  ]);
  const [country, setCountry] = useState(career?.country || "Philippines");
  const [province, setProvince] = useState(career?.province || "");
  const [city, setCity] = useState(career?.location || "");
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState("");
  const [isSavingCareer, setIsSavingCareer] = useState(false);
  const savingCareerRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [cvSecretPrompt, setCvSecretPrompt] = useState(career?.cvSecretPrompt || "");
  const [aiInterviewSecretPrompt, setAiInterviewSecretPrompt] = useState(career?.aiInterviewSecretPrompt || "");
  const [preScreeningQuestions, setPreScreeningQuestions] = useState(career?.preScreeningQuestions || []);
  const [addedSuggestedQuestions, setAddedSuggestedQuestions] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ member: any, role: string }>>(career?.teamMembers || []);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [reviewSectionExpanded, setReviewSectionExpanded] = useState({
    careerDetails: true,
    jobDescription: true,
    cvReview: true,
    aiInterview: true,
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPreScreeningQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id.toString() === active.id);
        const newIndex = items.findIndex((item) => item.id.toString() === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex);
        }
        return items;
      });
    }
  };

  const handleAddSuggestedQuestion = (questionType: string) => {
    let newQuestion: any = { id: Date.now() };

    switch (questionType) {
      case "Notice Period":
        newQuestion = {
          ...newQuestion,
          question: "How long is your notice period?",
          type: "Dropdown",
          config: {
            options: ["Immediately", "<30 days", ">30 days"]
          }
        };
        break;
      case "Work Setup":
        newQuestion = {
          ...newQuestion,
          question: "What is your preferred work setup?",
          type: "Dropdown",
          config: {
            options: [
              "At most 1-2x a week",
              "At most 3-4x a week",
              "Open to fully onsite work",
              "Only open to fully remote work"
            ]
          }
        };
        break;
      case "Asking Salary":
        newQuestion = {
          ...newQuestion,
          question: "How much is your expected monthly salary?",
          type: "Range",
          config: {
            min: "40000",
            max: "60000"
          }
        };
        break;
    }

    setPreScreeningQuestions([...preScreeningQuestions, newQuestion]);
    setAddedSuggestedQuestions([...addedSuggestedQuestions, questionType]);
  };

  const steps = [
    { number: 1, title: "Career Details & Team Access" },
    { number: 2, title: "CV Review & Pre-screening" },
    { number: 3, title: "AI Interview Setup" },
    { number: 4, title: "Pipeline Stages" },
    { number: 5, title: "Review Career" },
  ];

  const isFormValid = () => {
    return jobTitle?.trim().length > 0 && description?.trim().length > 0 && questions.some((q) => q.questions.length > 0) && workSetup?.trim().length > 0;
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return jobTitle?.trim().length > 0 && workSetup?.trim().length > 0 && employmentType?.trim().length > 0 && description?.trim().length > 0;
      case 2:
        return true; // Team Access is optional
      case 3:
        return true;
      case 4:
        return true; // Settings are optional
      case 5:
        return true; // Settings are optional
      default:
        return false;
    }
  }

  const handleNext = () => {
    if (isStepValid(currentStep) && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  const updateCareer = async (status: string) => {
    if (Number(minimumSalary) && Number(maximumSalary) && Number(minimumSalary) > Number(maximumSalary)) {
      errorToast("Minimum salary cannot be greater than maximum salary", 1300);
      return;
    }
    let userInfoSlice = {
      image: user.image,
      name: user.name,
      email: user.email,
    };
    const updatedCareer = {
      _id: career._id,
      jobTitle,
      description,
      workSetup,
      workSetupRemarks,
      questions,
      lastEditedBy: userInfoSlice,
      status,
      updatedAt: Date.now(),
      screeningSetting,
      requireVideo,
      salaryNegotiable,
      minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
      maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
      country,
      province,
      // Backwards compatibility
      location: city,
      employmentType,
      cvSecretPrompt,
      aiInterviewSecretPrompt,
      preScreeningQuestions,
      teamMembers,
    }
    try {
      setIsSavingCareer(true);
      const response = await axios.post("/api/update-career", updatedCareer);
      if (response.status === 200) {
        candidateActionToast(
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Career updated</span>
          </div>,
          1300,
          <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>)
        setTimeout(() => {
          window.location.href = `/recruiter-dashboard/careers/manage/${career._id}`;
        }, 1300);
      }
    } catch (error) {
      console.error(error);
      errorToast("Failed to update career", 1300);
    } finally {
      setIsSavingCareer(false);
    }
  }


  const confirmSaveCareer = (status: string) => {
    if (Number(minimumSalary) && Number(maximumSalary) && Number(minimumSalary) > Number(maximumSalary)) {
      errorToast("Minimum salary cannot be greater than maximum salary", 1300);
      return;
    }

    setShowSaveModal(status);
  }

  const saveCareer = async (status: string) => {
    setShowSaveModal("");
    if (!status) {
      return;
    }

    if (!savingCareerRef.current) {
      setIsSavingCareer(true);
      savingCareerRef.current = true;
      let userInfoSlice = {
        image: user.image,
        name: user.name,
        email: user.email,
      };
      const career = {
        jobTitle,
        description,
        workSetup,
        workSetupRemarks,
        questions,
        lastEditedBy: userInfoSlice,
        createdBy: userInfoSlice,
        screeningSetting,
        orgID,
        requireVideo,
        salaryNegotiable,
        minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
        maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
        country,
        province,
        // Backwards compatibility
        location: city,
        status,
        employmentType,
        cvSecretPrompt,
        aiInterviewSecretPrompt,
        preScreeningQuestions,
        teamMembers,
      }

      try {

        const response = await axios.post("/api/add-career", career);
        if (response.status === 200) {
          candidateActionToast(
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Career added {status === "active" ? "and published" : ""}</span>
            </div>,
            1300,
            <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>)
          setTimeout(() => {
            window.location.href = `/recruiter-dashboard/careers`;
          }, 1300);
        }
      } catch (error) {
        errorToast("Failed to add career", 1300);
      } finally {
        savingCareerRef.current = false;
        setIsSavingCareer(false);
      }
    }
  }

  useEffect(() => {
    const parseProvinces = () => {
      setProvinceList(philippineCitiesAndProvinces.provinces);

      // Only set city list if editing an existing career with a province
      if (career?.province) {
        const provinceObj = philippineCitiesAndProvinces.provinces.find((p) => p.name === career.province);
        if (provinceObj) {
          const cities = philippineCitiesAndProvinces.cities.filter((city) => city.province === provinceObj.key);
          setCityList(cities);
        }
      }
    }
    parseProvinces();
  }, [career])

  // Automatically add current user as Owner when form loads (only for new careers)
  useEffect(() => {
    if (!career && user && teamMembers.length === 0) {
      const currentUserMember = {
        _id: user.id || user.email,
        name: user.name,
        email: user.email,
        image: user.image || user.picture,
        orgID: orgID
      };
      setTeamMembers([{ member: currentUserMember, role: "Job Owner" }]);
    }
  }, [user, orgID, career])

  return (
    <div className="col">
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 550, color: "#111827" }}>
          {formType === "add" ? "Add new career" : "Edit Career Details"}
        </h1>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
          {currentStep > 1 && (
            <button
              style={{
                width: "fit-content",
                color: "#414651",
                background: "#fff",
                border: "1px solid #D5D7DA",
                padding: "8px 16px",
                borderRadius: "60px",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
              onClick={handlePrevious}>
              <i className="la la-arrow-left" style={{ marginRight: 8 }}></i>
              Back
            </button>
          )}

          <button
            disabled={isSavingCareer}
            style={{
              width: "fit-content",
              color: "#414651",
              background: "#fff",
              border: "1px solid #D5D7DA",
              padding: "8px 16px",
              borderRadius: "60px",
              cursor: isSavingCareer ? "not-allowed" : "pointer",
              whiteSpace: "nowrap"
            }}
            onClick={() => {
              confirmSaveCareer("inactive");
            }}>
            Save as Unpublished
          </button>

          {currentStep < steps.length ? (
            <button
              disabled={!isStepValid(currentStep)}
              style={{
                width: "fit-content",
                background: !isStepValid(currentStep) ? "#D5D7DA" : "black",
                color: "#fff",
                border: "1px solid #E9EAEB",
                padding: "8px 16px",
                borderRadius: "60px",
                cursor: !isStepValid(currentStep) ? "not-allowed" : "pointer",
                whiteSpace: "nowrap"
              }}
              onClick={handleNext}>
              Save and Continue
              <i className="la la-arrow-right" style={{ marginLeft: 8 }}></i>
            </button>
          ) : (
            <button
              disabled={!isFormValid() || isSavingCareer}
              style={{
                width: "fit-content",
                background: !isFormValid() || isSavingCareer ? "#D5D7DA" : "black",
                color: "#fff",
                border: "1px solid #E9EAEB",
                padding: "8px 16px",
                borderRadius: "60px",
                cursor: !isFormValid() || isSavingCareer ? "not-allowed" : "pointer",
                whiteSpace: "nowrap"
              }}
              onClick={() => {
                confirmSaveCareer("active");
              }}>
              <i className="la la-check-circle" style={{ color: "#fff", fontSize: 20, marginRight: 8 }}></i>
              Save & Publish
            </button>
          )}
        </div>
      </div>

      {/* Progress Step Bar */}
      <ProgressStepBar
        steps={steps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />
      <hr
        style={{
          marginTop: 0,
          marginBottom: 0,
          border: 0,
          borderTop: '2px solid rgba(0, 0, 0, 0.1)',
        }}
      />
      {/* Form Content */}
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: currentStep === 4 || currentStep === 5 ? "100%" : "70%", display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Step 1: Career Details & Team Access */}
          {currentStep === 1 && (
            <>
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <span style={{ fontSize: 20, color: "#181D27", fontWeight: 700 }}>1. Basic Information</span>
                  <div className="layered-card-content">
                    <span>Job Title</span>
                    <input
                      value={jobTitle}
                      className="form-control"
                      placeholder="Enter job title"
                      onChange={(e) => {
                        setJobTitle(e.target.value || "");
                      }}
                    ></input>
                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Work Setting</span>
                    <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span>Employment Type</span>
                        <CustomDropdown
                          onSelectSetting={(employmentType) => {
                            setEmploymentType(employmentType);
                          }}
                          screeningSetting={employmentType}
                          settingList={employmentTypeOptions}
                          placeholder="Select Employment Type"
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span>Arrangement</span>
                        <CustomDropdown
                          onSelectSetting={(setting) => {
                            setWorkSetup(setting);
                          }}
                          screeningSetting={workSetup}
                          settingList={workSetupOptions}
                          placeholder="Select Work Setup"
                        />
                      </div>
                    </div>

                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Location</span>
                    <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span>Country</span>
                        <CustomDropdown
                          onSelectSetting={(setting) => {
                            setCountry(setting);
                          }}
                          screeningSetting={country}
                          settingList={[]}
                          placeholder="Select Country"
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span>State / Province</span>
                        <CustomDropdown
                          onSelectSetting={(province) => {
                            setProvince(province);
                            const provinceObj = provinceList.find((p) => p.name === province);
                            if (provinceObj) {
                              const cities = philippineCitiesAndProvinces.cities.filter((city) => city.province === provinceObj.key);
                              setCityList(cities);
                              setCity(""); // Reset city when province changes
                            }
                          }}
                          screeningSetting={province}
                          settingList={provinceList}
                          placeholder="Select State / Province"
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span>City</span>
                        <CustomDropdown
                          onSelectSetting={(city) => {
                            setCity(city);
                          }}
                          screeningSetting={city}
                          settingList={cityList}
                          placeholder="Select City"
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Salary</span>

                      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 8, minWidth: "130px" }}>
                        <label className="switch">
                          <input type="checkbox" checked={salaryNegotiable} onChange={() => setSalaryNegotiable(!salaryNegotiable)} />
                          <span className="slider round"></span>
                        </label>
                        <span>{salaryNegotiable ? "Negotiable" : "Fixed"}</span>
                      </div>
                    </div>

                    <SalaryRangeInput
                      minimumSalary={minimumSalary}
                      maximumSalary={maximumSalary}
                      setMinimumSalary={setMinimumSalary}
                      setMaximumSalary={setMaximumSalary}
                    />
                  </div>
                </div>
              </div>

              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <span style={{ fontSize: 20, color: "#181D27", fontWeight: 700 }}>2. Job Description</span>
                  <div className="layered-card-content">
                    <span>Provide a detailed description of the role, responsibilities, and requirements.</span>
                    <RichTextEditor setText={setDescription} text={description} />
                  </div>
                </div>
              </div>
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <span style={{ fontSize: 20, color: "#181D27", fontWeight: 700 }}>3. Team Access</span>
                  <div className="layered-card-content">
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#181D27", fontWeight: 700 }}>Add more members</span>
                        <span>You can add other members to collaborate on this career.</span>
                      </div>
                      <div style={{ width: "300px" }}>
                        <MemberSearchDropdown
                          orgID={orgID}
                          onSelectMember={(member) => {
                            setTeamMembers([...teamMembers, { member: member, role: "Contributor" }]);
                            setSelectedMember(null);
                          }}
                          selectedMember={selectedMember}
                          placeholder="Add member"
                          excludeMembers={[
                            ...teamMembers.map(tm => tm.member._id),
                            user?.email
                          ]}
                        />
                      </div>
                    </div>
                    <hr
                      style={{
                        margin: "20px 0",
                        border: "none",
                        borderTop: '1px solid #B3B3B3',
                        width: "100%",
                      }}
                    />

                    {/* Added Members List */}
                    {teamMembers.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#181D27" }}>Team Members ({teamMembers.length})</span>
                        {teamMembers.map((tm, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "12px",
                              background: "#F9FAFB",
                              borderRadius: "8px",
                              border: "1px solid #E5E7EB",
                              gap: "12px"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                              {tm.member.image ? (
                                <img
                                  src={tm.member.image}
                                  alt={tm.member.name}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    objectFit: "cover"
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "14px",
                                    fontWeight: "600"
                                  }}
                                >
                                  {tm.member.name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 600, fontSize: "14px", color: "#181D27" }}>
                                  {tm.member.name}
                                </span>
                                <span style={{ fontSize: "12px", color: "#6B7280" }}>
                                  {tm.member.email}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ minWidth: "250px" }}>
                                <CustomDropdown
                                  onSelectSetting={(role) => {
                                    const updatedMembers = [...teamMembers];
                                    updatedMembers[index] = { ...updatedMembers[index], role };
                                    setTeamMembers(updatedMembers);
                                  }}
                                  screeningSetting={tm.role}
                                  settingList={roleOptions}
                                  placeholder="Select Role"
                                />
                              </div>
                              <button
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#EF4444",
                                  fontSize: "18px",
                                  padding: "4px 8px"
                                }}
                                onClick={() => {
                                  setTeamMembers(teamMembers.filter((_, i) => i !== index));
                                }}
                              >
                                <i className="la la-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <span style={{ fontSize: "12px" }}>*Admins can view all careers regardless of specific access settings.</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: CV Review & Pre-screening */}
          {currentStep === 2 && (
            <>
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <span style={{ fontSize: 20, color: "#181D27", fontWeight: 700 }}>1. CV Review Settings</span>
                  <div className="layered-card-content">
                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>CV Screening</span>
                    <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                      <span>Jia automatically endorses candidates who meet the chosen criteria.</span>
                    </div>
                    <CustomDropdown
                      onSelectSetting={(setting) => {
                        setScreeningSetting(setting);
                      }}
                      screeningSetting={screeningSetting}
                      settingList={screeningSettingList}
                    />
                    <hr
                      style={{
                        margin: "20px 0",
                        border: "none",
                        borderTop: '1px solid #B3B3B3', // Use a standard gray color
                        width: "100%",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                        CV Secret Prompt
                      </span>
                      <span style={{ marginLeft: 4 }}>(optional)</span>
                    </div>
                    <span>Secret Prompts give you extra control over Jia's evaluation style, complementing her accurate assessment of requirements from the job description.</span>
                    <SimpleTextEditor placeholder="Enter a secret prompt (e.g., Give higher fit scores to canditates who partcipate in hackathons or competitions.)" setText={setCvSecretPrompt} text={cvSecretPrompt} />
                  </div>
                </div>
              </div>
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20, color: "#181D27", fontWeight: 700 }}>2. Pre-Screening Questions</span>
                      <span>(optional)</span>
                      <div style={{ borderRadius: "50%", width: 30, height: 22, border: "1px solid #D5D9EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, backgroundColor: "#F8F9FC", color: "#181D27", fontWeight: 700 }}>
                        {preScreeningQuestions.length}
                      </div>
                    </div>
                    <button
                      style={{
                        width: "fit-content",
                        background: "black",
                        color: "#fff",
                        border: "1px solid #E9EAEB",
                        padding: "8px 16px",
                        borderRadius: "60px",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setPreScreeningQuestions([
                          ...preScreeningQuestions,
                          { question: "", type: "Short Answer", config: {}, id: Date.now() }
                        ]);
                      }}>
                      <i className="la la-plus" style={{ marginRight: 8 }}></i>
                      Add Custom
                    </button>
                  </div>

                  <div className="layered-card-content">
                    {preScreeningQuestions.length === 0 && (
                      <span style={{ fontSize: 16, textAlign: "center" }}>No pre-screening questions added yet.</span>
                    )}
                    {preScreeningQuestions.length > 0 && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={preScreeningQuestions.map(q => q.id.toString())}
                          strategy={verticalListSortingStrategy}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                            {preScreeningQuestions.map((q) => (
                              <SortableItem key={q.id} id={q.id.toString()}>
                                <QuestionFormField
                                  question={q.question}
                                  questionType={q.type}
                                  config={q.config}
                                  onUpdate={(question, type, config) => {
                                    setPreScreeningQuestions((prevQuestions) => {
                                      const index = prevQuestions.findIndex((item) => item.id === q.id);
                                      const updatedQuestions = [...prevQuestions];
                                      updatedQuestions[index] = { ...prevQuestions[index], question, type, config };
                                      return updatedQuestions;
                                    });
                                  }}
                                  onRemove={() => {
                                    setPreScreeningQuestions(preScreeningQuestions.filter((item) => item.id !== q.id));

                                    // Re-enable the suggested question button if this was a suggested question
                                    const suggestedQuestionMap: { [key: string]: string } = {
                                      "How long is your notice period?": "Notice Period",
                                      "What is your preferred work setup?": "Work Setup",
                                      "How much is your expected monthly salary?": "Asking Salary"
                                    };

                                    const suggestedType = suggestedQuestionMap[q.question];
                                    if (suggestedType) {
                                      setAddedSuggestedQuestions(addedSuggestedQuestions.filter((type) => type !== suggestedType));
                                    }
                                  }}
                                />
                              </SortableItem>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                    <hr
                      style={{
                        margin: "20px 0",
                        border: "none",
                        borderTop: '1px solid #B3B3B3',
                        width: "100%",
                      }}
                    />
                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700, marginBottom: 15 }}>
                      Suggested Pre-Screening Questions:
                    </span>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", }}>
                        <span style={{ color: "#181D27", fontWeight: 700 }}>Notice Period</span>
                        <span>How long is your notice period?</span>
                      </div>
                      <button
                        disabled={addedSuggestedQuestions.includes("Notice Period")}
                        style={{
                          width: "fit-content",
                          background: addedSuggestedQuestions.includes("Notice Period") ? "#f3f4f6" : "white",
                          color: addedSuggestedQuestions.includes("Notice Period") ? "#9ca3af" : "black",
                          border: addedSuggestedQuestions.includes("Notice Period") ? "1px solid #d1d5db" : "1px solid black",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                          cursor: addedSuggestedQuestions.includes("Notice Period") ? "not-allowed" : "pointer",
                        }}
                        onClick={() => handleAddSuggestedQuestion("Notice Period")}>
                        {addedSuggestedQuestions.includes("Notice Period") ? "Added" : "Add"}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", }}>
                        <span style={{ color: "#181D27", fontWeight: 700 }}>Work Setup</span>
                        <span>How often are you willing to report to the office each week?</span>
                      </div>
                      <button
                        disabled={addedSuggestedQuestions.includes("Work Setup")}
                        style={{
                          width: "fit-content",
                          background: addedSuggestedQuestions.includes("Work Setup") ? "#f3f4f6" : "white",
                          color: addedSuggestedQuestions.includes("Work Setup") ? "#9ca3af" : "black",
                          border: addedSuggestedQuestions.includes("Work Setup") ? "1px solid #d1d5db" : "1px solid black",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                          cursor: addedSuggestedQuestions.includes("Work Setup") ? "not-allowed" : "pointer",
                        }}
                        onClick={() => handleAddSuggestedQuestion("Work Setup")}>
                        {addedSuggestedQuestions.includes("Work Setup") ? "Added" : "Add"}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", }}>
                        <span style={{ color: "#181D27", fontWeight: 700 }}>Asking Salary</span>
                        <span>How much is your expected monthly salary?</span>
                      </div>
                      <button
                        disabled={addedSuggestedQuestions.includes("Asking Salary")}
                        style={{
                          width: "fit-content",
                          background: addedSuggestedQuestions.includes("Asking Salary") ? "#f3f4f6" : "white",
                          color: addedSuggestedQuestions.includes("Asking Salary") ? "#9ca3af" : "black",
                          border: addedSuggestedQuestions.includes("Asking Salary") ? "1px solid #d1d5db" : "1px solid black",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                          cursor: addedSuggestedQuestions.includes("Asking Salary") ? "not-allowed" : "pointer",
                        }}
                        onClick={() => handleAddSuggestedQuestion("Asking Salary")}>
                        {addedSuggestedQuestions.includes("Asking Salary") ? "Added" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3: AI Interview Setup */}
          {currentStep === 3 && (
            <>
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <span style={{ fontSize: 20, color: "#181D27", fontWeight: 700 }}>1. AI Interview Settings</span>
                  <div className="layered-card-content">
                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>AI Interview Screening</span>
                    <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                      <span>Jia automatically endorses candidates who meet the chosen criteria.</span>
                    </div>
                    <CustomDropdown
                      onSelectSetting={(setting) => {
                        setScreeningSetting(setting);
                      }}
                      screeningSetting={screeningSetting}
                      settingList={screeningSettingList}
                    />
                    <hr
                      style={{
                        margin: "20px 0",
                        border: "none",
                        borderTop: '1px solid #B3B3B3',
                        width: "100%",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                        Require Video on Interview
                      </span>
                      <span>Require candidates to keep their camera on. Recordings will appear on their analysis page.</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                        <i className="la la-video" style={{ color: "#414651", fontSize: 20 }}></i>
                        <span style={{ color: "#181D27" }}>Require Video Interview</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                        <label className="switch">
                          <input type="checkbox" checked={requireVideo} onChange={() => setRequireVideo(!requireVideo)} />
                          <span className="slider round"></span>
                        </label>
                        <span>{requireVideo ? "Yes" : "No"}</span>
                      </div>
                    </div>
                    <hr
                      style={{
                        margin: "20px 0",
                        border: "none",
                        borderTop: '1px solid #B3B3B3',
                        width: "100%",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                        AI Interview Secret Prompt
                      </span>
                      <span style={{ marginLeft: 4 }}>(optional)</span>
                    </div>
                    <span>Secret Prompts give you extra control over Jia's evaluation style, complementing her accurate assessment of requirements from the job description.</span>
                    <SimpleTextEditor placeholder="Enter a secret prompt (e.g., Treat candidates who speak Taglish, English, or Tagalog equally. Focus on clarity, coherence, and confidence rather than language preference or accent.)" setText={setAiInterviewSecretPrompt} text={aiInterviewSecretPrompt} />
                  </div>
                </div>
              </div>
              <InterviewQuestionGeneratorV2 questions={questions} setQuestions={setQuestions} jobTitle={jobTitle} description={description} />
            </>

          )}

          {/* Step 4: Additional Settings */}
          {currentStep === 4 && (
            <></>
          )}

          {/* Step 5: Review Career */}
          {currentStep === 5 && (
            <>
              {/* Career Details & Team Access */}
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div
                    style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    onClick={() => setReviewSectionExpanded(prev => ({ ...prev, careerDetails: !prev.careerDetails }))}
                  >
                    <span style={{ fontSize: 20, color: "#181D27", fontWeight: 700 }}>Career Details & Team Access</span>
                    <i className={`la la-angle-${reviewSectionExpanded.careerDetails ? 'up' : 'down'}`} style={{ fontSize: 24, color: "#181D27" }}></i>
                  </div>
                  {reviewSectionExpanded.careerDetails && (
                    <div className="layered-card-content">
                      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {/* Job Title */}
                        <div style={{ paddingBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                          <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>Job Title</span>
                          <p style={{ fontSize: 16, color: "#6B7280", margin: "8px 0 0 0" }}>{jobTitle || "Not specified"}</p>
                        </div>

                        {/* Employment Type & Work Arrangement */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, paddingBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                          <div>
                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>Employment Type</span>
                            <p style={{ fontSize: 16, color: "#6B7280", margin: "8px 0 0 0" }}>{employmentType || "Not specified"}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>Work Arrangement</span>
                            <p style={{ fontSize: 16, color: "#6B7280", margin: "8px 0 0 0" }}>{workSetup || "Not specified"}</p>
                          </div>
                        </div>

                        {/* Location */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, paddingBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                          <div>
                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>Country</span>
                            <p style={{ fontSize: 16, color: "#6B7280", margin: "8px 0 0 0" }}>{country || "Not specified"}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>State / Province</span>
                            <p style={{ fontSize: 16, color: "#6B7280", margin: "8px 0 0 0" }}>{province || "Not specified"}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>City</span>
                            <p style={{ fontSize: 16, color: "#6B7280", margin: "8px 0 0 0" }}>{city || "Not specified"}</p>
                          </div>
                        </div>

                        {/* Salary */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, paddingBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                          <div>
                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>Minimum Salary</span>
                            <p style={{ fontSize: 16, color: "#6B7280", margin: "8px 0 0 0" }}>
                              {salaryNegotiable ? "Negotiable" : (minimumSalary || "Not specified")}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>Maximum Salary</span>
                            <p style={{ fontSize: 16, color: "#6B7280", margin: "8px 0 0 0" }}>
                              {salaryNegotiable ? "Negotiable" : (maximumSalary || "Not specified")}
                            </p>
                          </div>
                        </div>

                        {/* Job Description */}
                        <div style={{ paddingBottom: 16, borderBottom: "1px solid #E5E7EB" }}>
                          <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>Job Description</span>
                          <div style={{ fontSize: 16, color: "#6B7280", marginTop: 8 }} dangerouslySetInnerHTML={{ __html: description || "No description provided" }} />
                        </div>

                        {/* Team Access */}
                        {teamMembers.length > 0 && (
                          <div>
                            <span style={{ fontSize: 14, color: "#181D27", fontWeight: 700 }}>Team Access</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                              {teamMembers.map((tm, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <img src={tm.member.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                                    <div>
                                      <p style={{ fontSize: 14, color: "#181D27", margin: 0, fontWeight: 600 }}>
                                        {tm.member.name}
                                        {tm.member.email === orgID && <span style={{ color: "#6B7280", fontWeight: 400 }}> (You)</span>}
                                      </p>
                                      <p style={{ fontSize: 13, color: "#6B7280", margin: "2px 0 0 0" }}>{tm.member.email}</p>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 500 }}>{tm.role}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <hr style={{ margin: "16px 0", border: 0, borderTop: "2px solid rgba(0, 0, 0, 0.1)" }} />

              {/* CV Review & Pre-screening */}
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div
                    style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    onClick={() => setReviewSectionExpanded(prev => ({ ...prev, cvReview: !prev.cvReview }))}
                  >
                    <span style={{ fontSize: 20, color: "#181D27", fontWeight: 700 }}>CV Review & Pre-screening</span>
                    <i className={`la la-angle-${reviewSectionExpanded.cvReview ? 'up' : 'down'}`} style={{ fontSize: 24, color: "#181D27" }}></i>
                  </div>
                  {reviewSectionExpanded.cvReview && (
                    <div className="layered-card-content">
                      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {/* CV Screening */}
                        <div>
                          <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>CV Screening</span>
                          <p style={{ fontSize: 14, color: "#6B7280", margin: "8px 0 0 0" }}>
                            Automatically endorse candidates who are <span style={{ padding: "2px 8px", backgroundColor: "#E0F2FE", color: "#0369A1", borderRadius: 4, fontWeight: 600 }}>{screeningSetting}</span> and above
                          </p>
                        </div>

                        {/* CV Secret Prompt */}
                        {cvSecretPrompt && (
                          <div>
                            <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                              CV Secret Prompt
                            </span>
                            <div style={{ marginTop: 8 }}>
                              {cvSecretPrompt.split('\n').map((line, idx) => (
                                line.trim() && (
                                  <p key={idx} style={{ fontSize: 14, color: "#6B7280", margin: "4px 0", paddingLeft: 16, position: "relative" }}>
                                    <span style={{ position: "absolute", left: 0 }}>•</span>
                                    {line.trim()}
                                  </p>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pre-Screening Questions */}
                        {preScreeningQuestions.length > 0 && (
                          <div>
                            <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                              Pre-Screening Questions <span style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>{preScreeningQuestions.length}</span>
                            </span>
                            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 16 }}>
                              {preScreeningQuestions.map((q, idx) => (
                                <div key={idx}>
                                  <p style={{ fontSize: 14, color: "#181D27", margin: 0, fontWeight: 600 }}>
                                    {idx + 1}. {q.question}
                                  </p>
                                  {q.config?.options && q.config.options.length > 0 ? (
                                    <ul style={{ margin: "8px 0 0 0", paddingLeft: 24 }}>
                                      {q.config.options.map((option, optIdx) => (
                                        <li key={optIdx} style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>
                                          {option}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : q.type === "Range" && q.config?.min && q.config?.max ? (
                                    <p style={{ fontSize: 14, color: "#6B7280", margin: "8px 0 0 24px", fontStyle: "italic" }}>
                                      Preferred: PHP {q.config.min} - PHP {q.config.max}
                                    </p>
                                  ) : q.config?.preferred ? (
                                    <p style={{ fontSize: 14, color: "#6B7280", margin: "8px 0 0 24px", fontStyle: "italic" }}>
                                      Preferred: {q.config.preferred}
                                    </p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <hr style={{ margin: "16px 0", border: 0, borderTop: "2px solid rgba(0, 0, 0, 0.1)" }} />

              {/* AI Interview Setup */}
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div
                    style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    onClick={() => setReviewSectionExpanded(prev => ({ ...prev, aiInterview: !prev.aiInterview }))}
                  >
                    <span style={{ fontSize: 20, color: "#181D27", fontWeight: 700 }}>AI Interview Setup</span>
                    <i className={`la la-angle-${reviewSectionExpanded.aiInterview ? 'up' : 'down'}`} style={{ fontSize: 24, color: "#181D27" }}></i>
                  </div>
                  {reviewSectionExpanded.aiInterview && (
                    <div className="layered-card-content">
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                          <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600 }}>AI Interview Secret Prompt</span>
                          <p style={{ fontSize: 16, color: "#181D27", margin: "4px 0 0 0" }}>
                            {aiInterviewSecretPrompt || "No secret prompt added"}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: 14, color: "#6B7280", fontWeight: 600 }}>Interview Questions</span>
                          <p style={{ fontSize: 16, color: "#181D27", margin: "4px 0 0 0" }}>
                            {questions.reduce((total, category) => total + category.questions.length, 0)} questions across {questions.filter(q => q.questions.length > 0).length} categories
                          </p>
                          {questions.filter(q => q.questions.length > 0).length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                              {questions.filter(q => q.questions.length > 0).map((category, idx) => (
                                <div key={idx} style={{ padding: "12px", backgroundColor: "#F8F9FC", borderRadius: 8 }}>
                                  <p style={{ fontSize: 14, color: "#181D27", margin: "0 0 8px 0", fontWeight: 700 }}>
                                    {category.category} ({category.questions.length} questions)
                                  </p>
                                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                                    {category.questions.map((q, qIdx) => (
                                      <li key={qIdx} style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>
                                        {q.question}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {currentStep !== 4 && currentStep !== 5 && (
          <div style={{ width: "30%", display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="layered-card-outer">
              <div className="layered-card-middle">
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <i className="la la-lightbulb" style={{ color: "#181D27", fontSize: 20 }}></i>
                  <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Tips</span>
                </div>
                <div className="layered-card-content">
                  {currentStep === 1 && (
                    <>
                      <span><b>Use clear, standard job titles </b>for better searchability (e.g., "Software Engineer" instead of "Code Ninja").</span>
                      <span><b>Be specific about responsibilities </b>and day-to-day tasks in the description.</span>
                      <span><b>Include required skills </b>and qualifications to attract qualified candidates.</span>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <span><b>Add a Secret Prompt </b>to fine-tune how Jia scores and evaluates submitted CVs.</span>
                      <span><b>Add Pre-Screening Questions </b>to collect key details such as notice period, work setup, or salary expectations to guide your review and candidate discussions.</span>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <span><b>Add a Secret Prompt </b>to fine-tune how Jia scores and evaluates the interview responses.</span>
                      <span><b>Use "Generate Questions" </b>to quickly create tailored interview questions, then refine or mix them with your own for balanced results.</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {showSaveModal && (
        <CareerActionModal action={showSaveModal} onAction={(action) => saveCareer(action)} />
      )}
      {isSavingCareer && (
        <FullScreenLoadingAnimation title={formType === "add" ? "Saving career..." : "Updating career..."} subtext={`Please wait while we are ${formType === "add" ? "saving" : "updating"} the career`} />
      )}
    </div>
  )
}