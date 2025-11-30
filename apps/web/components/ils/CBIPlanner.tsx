"use client";

import React, { useState, ChangeEvent } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Calendar, MapPin, Users, Car, Plus, Trash2, 
  CheckCircle2, AlertCircle, Clock 
} from "lucide-react";

// Types
interface CBIActivity {
  id?: string;
  skillId: string;
  skillName: string;
  activityName: string;
  activityDescription?: string;
  orderInSession: number;
  targetSteps: number[];
  targetPromptLevel: string;
}

interface CBISessionData {
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  locationName: string;
  locationAddress?: string;
  settingType: string;
  instructorName: string;
  staffRatio?: string;
  additionalStaff: string[];
  transportationType?: string;
  transportationNotes?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalNotes?: string;
  preTeachingNotes?: string;
  activities: CBIActivity[];
}

interface AvailableSkill {
  id: string;
  name: string;
  domain: string;
  totalSteps: number;
}

interface CBIPlannerProps {
  availableSkills: AvailableSkill[];
  existingSession?: CBISessionData;
  onSave: (data: CBISessionData) => void;
  isSubmitting?: boolean;
}

const settingTypes = [
  { value: "COMMUNITY_STORE", label: "Retail Store", icon: "🛒" },
  { value: "COMMUNITY_RESTAURANT", label: "Restaurant", icon: "🍔" },
  { value: "COMMUNITY_TRANSPORT", label: "Public Transportation", icon: "🚌" },
  { value: "COMMUNITY_MEDICAL", label: "Medical Facility", icon: "🏥" },
  { value: "COMMUNITY_RECREATION", label: "Recreation Center", icon: "🎾" },
  { value: "COMMUNITY_WORKPLACE", label: "Workplace", icon: "💼" },
  { value: "COMMUNITY_GOVERNMENT", label: "Government Office", icon: "🏢" },
  { value: "COMMUNITY_LIBRARY", label: "Library", icon: "📚" },
  { value: "COMMUNITY_BANK", label: "Bank", icon: "🏦" },
  { value: "COMMUNITY_OTHER", label: "Other Community", icon: "🏘️" },
];

const promptLevels = [
  { value: "FULL_PHYSICAL", label: "Full Physical" },
  { value: "PARTIAL_PHYSICAL", label: "Partial Physical" },
  { value: "MODELING", label: "Modeling" },
  { value: "GESTURAL", label: "Gestural" },
  { value: "VERBAL_DIRECT", label: "Verbal Direct" },
  { value: "VERBAL_INDIRECT", label: "Verbal Indirect" },
  { value: "VISUAL", label: "Visual" },
  { value: "INDEPENDENT", label: "Independent" },
];

const transportationTypes = [
  "School Bus",
  "Public Transit",
  "Walking",
  "Parent Transport",
  "Staff Vehicle",
  "Rideshare",
];

export function CBIPlanner({
  availableSkills,
  existingSession,
  onSave,
  isSubmitting = false,
}: CBIPlannerProps) {
  const [formData, setFormData] = useState<CBISessionData>(
    existingSession || {
      scheduledDate: "",
      startTime: "",
      endTime: "",
      locationName: "",
      locationAddress: "",
      settingType: "COMMUNITY_STORE",
      instructorName: "",
      staffRatio: "1:1",
      additionalStaff: [],
      transportationType: "School Bus",
      transportationNotes: "",
      emergencyContact: "",
      emergencyPhone: "",
      medicalNotes: "",
      preTeachingNotes: "",
      activities: [],
    }
  );

  const [newStaffMember, setNewStaffMember] = useState("");

  const updateField = <K extends keyof CBISessionData>(
    field: K,
    value: CBISessionData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addStaffMember = () => {
    if (newStaffMember.trim()) {
      updateField("additionalStaff", [...formData.additionalStaff, newStaffMember.trim()]);
      setNewStaffMember("");
    }
  };

  const removeStaffMember = (index: number) => {
    updateField(
      "additionalStaff",
      formData.additionalStaff.filter((_, i) => i !== index)
    );
  };

  const addActivity = (skillId: string) => {
    const skill = availableSkills.find((s) => s.id === skillId);
    if (!skill) return;

    const newActivity: CBIActivity = {
      skillId,
      skillName: skill.name,
      activityName: `Practice ${skill.name}`,
      orderInSession: formData.activities.length + 1,
      targetSteps: [],
      targetPromptLevel: "VERBAL_DIRECT",
    };

    updateField("activities", [...formData.activities, newActivity]);
  };

  const updateActivity = (index: number, updates: Partial<CBIActivity>) => {
    const newActivities = [...formData.activities];
    newActivities[index] = { ...newActivities[index], ...updates };
    updateField("activities", newActivities);
  };

  const removeActivity = (index: number) => {
    updateField(
      "activities",
      formData.activities.filter((_, i) => i !== index)
    );
  };

  const handleSave = () => {
    onSave(formData);
  };

  const isValid = formData.scheduledDate && formData.locationName && formData.instructorName;

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Session Details
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("scheduledDate", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={formData.startTime || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("startTime", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={formData.endTime || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("endTime", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Setting Type</label>
              <select
                value={formData.settingType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField("settingType", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {settingTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.locationName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("locationName", e.target.value)}
                placeholder="e.g., Target on Main Street"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={formData.locationAddress || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("locationAddress", e.target.value)}
                placeholder="Full address"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staffing */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staffing
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Lead Instructor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.instructorName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("instructorName", e.target.value)}
                placeholder="Instructor name"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Staff Ratio</label>
              <select
                value={formData.staffRatio || "1:1"}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField("staffRatio", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="1:1">1:1</option>
                <option value="1:2">1:2</option>
                <option value="1:3">1:3</option>
                <option value="2:3">2:3</option>
                <option value="2:4">2:4</option>
              </select>
            </div>
          </div>

          {/* Additional Staff */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Additional Staff</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newStaffMember}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewStaffMember(e.target.value)}
                placeholder="Add staff member"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={addStaffMember}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {formData.additionalStaff.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.additionalStaff.map((staff, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {staff}
                    <button onClick={() => removeStaffMember(index)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transportation */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Car className="h-5 w-5" />
            Transportation
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Transportation Type</label>
              <select
                value={formData.transportationType || ""}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField("transportationType", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select...</option>
                {transportationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Transportation Notes</label>
              <input
                type="text"
                value={formData.transportationNotes || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("transportationNotes", e.target.value)}
                placeholder="Bus route, pickup time, etc."
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety & Emergency */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Safety & Emergency
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("emergencyContact", e.target.value)}
                placeholder="Contact name"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Emergency Phone</label>
              <input
                type="tel"
                value={formData.emergencyPhone || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("emergencyPhone", e.target.value)}
                placeholder="Phone number"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Medical Notes</label>
              <textarea
                value={formData.medicalNotes || ""}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateField("medicalNotes", e.target.value)}
                placeholder="Allergies, medications, medical conditions..."
                rows={2}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities/Skills */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Skills to Practice
            </h3>
            <select
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                if (e.target.value) {
                  addActivity(e.target.value);
                  e.target.value = "";
                }
              }}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="">+ Add Skill</option>
              {availableSkills
                .filter((s) => !formData.activities.some((a) => a.skillId === s.id))
                .map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {formData.activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No skills added yet. Add skills to practice during this CBI session.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.activities.map((activity, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="outline" className="mb-1">
                        Activity {index + 1}
                      </Badge>
                      <h4 className="font-medium">{activity.skillName}</h4>
                    </div>
                    <button
                      onClick={() => removeActivity(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Activity Name</label>
                      <input
                        type="text"
                        value={activity.activityName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateActivity(index, { activityName: e.target.value })
                        }
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Target Prompt Level</label>
                      <select
                        value={activity.targetPromptLevel}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          updateActivity(index, { targetPromptLevel: e.target.value })
                        }
                        className="w-full px-2 py-1 text-sm border rounded"
                      >
                        {promptLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-Teaching Notes */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pre-Teaching Preparation
          </h3>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.preTeachingNotes || ""}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateField("preTeachingNotes", e.target.value)}
            placeholder="Notes for pre-teaching activities before the CBI session..."
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={!isValid || isSubmitting}
          className={`
            px-6 py-2 rounded-md font-medium
            ${!isValid || isSubmitting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
            }
          `}
        >
          {isSubmitting ? "Saving..." : "Save CBI Session"}
        </button>
      </div>
    </div>
  );
}

export default CBIPlanner;
