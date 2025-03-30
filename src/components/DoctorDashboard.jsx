import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  UserCircleIcon,
  LogoutIcon,
  PencilIcon,
  TrashIcon,
  CloudUploadIcon,
} from "@heroicons/react/outline";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000"; // Adjust as needed

const DoctorDashboard = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [aggregatedProfiles, setAggregatedProfiles] = useState([]);
  const [error, setError] = useState("");
  const [removedRecords, setRemovedRecords] = useState([]);
  const [removedPrescriptions, setRemovedPrescriptions] = useState([]);
  const [removedRecordsState, setRemovedRecordsState] = useState([]);
  const [removedXrayRecords, setRemovedXrayRecords] = useState([]);
  // New patient/prescription/record forms
  const [newPatient, setNewPatient] = useState({
    FullName: "",
    Age: "",
    BloodType: "",
    Weight: "",
    Email: "",
    Username: "",
  });
  const [newPrescription, setNewPrescription] = useState({
    PatientID: "",
    Name: "",
    Dosage: "",
  });
  const [newRecord, setNewRecord] = useState({
    PatientID: "",
    Diagnosis: "",
    Date: "",
  });

  // X-Ray states
  const [selectedXrayPatient, setSelectedXrayPatient] = useState("");
  const [xrayFile, setXrayFile] = useState(null);
  const [xrayLoading, setXrayLoading] = useState(false);
  const [xrayAnalysis, setXrayAnalysis] = useState(null);

  // Editing
  const [editingPatient, setEditingPatient] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    if (
      !auth.isAuthenticated ||
      !auth.user?.profile["cognito:groups"]?.includes("Doctors")
    ) {
      navigate("/");
    } else {
      setUserData(auth.user?.profile);
      fetchAggregatedProfiles();
    }
  }, [auth, navigate]);

  const fetchAggregatedProfiles = async () => {
    try {
      const headers = { "x-role": "doctor" };
      const response = await axios.get(`${API_BASE_URL}/all-aggregated`, { headers });
      setAggregatedProfiles(response.data);
    } catch (err) {
      console.error("Error fetching aggregated profiles:", err);
      setError("Failed to fetch patient profiles");
    }
  };

  // New Patient Form Handlers
  const handleInputChange = (e) => {
    setNewPatient({ ...newPatient, [e.target.name]: e.target.value });
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const headers = { "x-role": "doctor" };
      await axios.post(`${API_BASE_URL}/create-patient`, newPatient, { headers });
      alert("Patient added successfully!");
      fetchAggregatedProfiles();
      setNewPatient({
        FullName: "",
        Age: "",
        BloodType: "",
        Weight: "",
        Email: "",
        Username: "",
      });
    } catch (err) {
      console.error("Error adding patient:", err);
      setError("Failed to add patient. Please try again.");
    }
  };
  
  // Prescription Form Handlers
  const handlePrescriptionChange = (e) => {
    setNewPrescription({ ...newPrescription, [e.target.name]: e.target.value });
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const headers = { "x-role": "doctor" };
      await axios.post(`${API_BASE_URL}/add-prescription`, newPrescription, { headers });
      fetchAggregatedProfiles();
      setNewPrescription({
        PatientID: "",
        Name: "",
        Dosage: "",
      });
    } catch (err) {
      console.error("Error adding prescription:", err);
      setError("Failed to add prescription. Please try again.");
    }
  };

  // Record Form Handlers
  const handleRecordChange = (e) => {
    setNewRecord({ ...newRecord, [e.target.name]: e.target.value });
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const headers = { "x-role": "doctor" };
      await axios.post(`${API_BASE_URL}/add-record`, newRecord, { headers });
      fetchAggregatedProfiles();
      setNewRecord({
        PatientID: "",
        Diagnosis: "",
        Date: "",
      });
    } catch (err) {
      console.error("Error adding record:", err);
      setError("Failed to add record. Please try again.");
    }
  };

  // X-Ray Upload Handlers
  const handleXrayUpload = async () => {
    if (!xrayFile) {
      alert("Please select an X-Ray file first.");
      return;
    }
    if (!selectedXrayPatient) {
      alert("Please select a patient for the X-Ray upload.");
      return;
    }
    setXrayLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", xrayFile);
      const headers = {
        "Content-Type": "multipart/form-data",
        "x-sub": selectedXrayPatient,
      };
      const response = await axios.post(`${API_BASE_URL}/analyze-xray`, formData, { headers });
      alert("X-Ray uploaded successfully!");
      setXrayAnalysis(response.data);
      fetchAggregatedProfiles();
    } catch (err) {
      console.error("Error uploading X-Ray:", err);
      setError("Failed to upload X-Ray. Please try again.");
    } finally {
      setXrayLoading(false);
    }
  };

  // Inline Editing Handlers
  const handleEditPatient = (profile, agg) => {
    setEditingPatient({
      ...profile,
      activePrescriptions: agg.activePrescriptions || [],
      recentRecords: agg.recentRecords || [],
      xrayRecords: agg.xrayRecords || [],
    });
  };

// For Active Prescriptions
const removePrescLine = (index) => {
    setRemovedPrescriptions((prev) => [
      ...prev,
      editingPatient.activePrescriptions[index],
    ]);
    setEditingPatient((prev) => ({
      ...prev,
      activePrescriptions: prev.activePrescriptions.filter((_, i) => i !== index),
    }));
  };
  
  const handlePrescLineChange = (index, field, value) => {
    setEditingPatient((prev) => {
      const newPrescs = [...prev.activePrescriptions];
      newPrescs[index] = { ...newPrescs[index], [field]: value };
      return { ...prev, activePrescriptions: newPrescs };
    });
  };
  
  // For Recent Records
  const removeRecordLine = (index) => {
    setRemovedRecordsState((prev) => [
      ...prev,
      editingPatient.recentRecords[index],
    ]);
    setEditingPatient((prev) => ({
      ...prev,
      recentRecords: prev.recentRecords.filter((_, i) => i !== index),
    }));
  };
  
  const handleRecordLineChange = (index, field, value) => {
    setEditingPatient((prev) => {
      const newRecords = [...prev.recentRecords];
      newRecords[index] = { ...newRecords[index], [field]: value };
      return { ...prev, recentRecords: newRecords };
    });
  };
  
  // For X-Ray Records
  const removeXrayLine = (index) => {
    setRemovedXrayRecords((prev) => [
      ...prev,
      editingPatient.xrayRecords[index],
    ]);
    setEditingPatient((prev) => ({
      ...prev,
      xrayRecords: prev.xrayRecords.filter((_, i) => i !== index),
    }));
  };
  
  const handleXrayLineChange = (index, field, value) => {
    setEditingPatient((prev) => {
      const newXrays = [...prev.xrayRecords];
      newXrays[index] = { ...newXrays[index], [field]: value };
      return { ...prev, xrayRecords: newXrays };
    });
  };

  const handleSaveEdit = async () => {
    try {
      const headers = { "x-role": "doctor" };
  
      // Log for debugging:
      console.log("Saving updated patient data:", editingPatient);
      console.log("Removed Prescriptions:", removedPrescriptions);
      console.log("Removed Records:", removedRecordsState);
      console.log("Removed X-Ray Records:", removedXrayRecords);
  
      // 1️⃣ Delete removed prescriptions
      for (const presc of removedPrescriptions) {
        await axios.delete(`${API_BASE_URL}/delete-item/${presc.RecordID}`, {
          headers,
          params: { "x-patient-id": editingPatient.PatientID },
        });
      }
  
      // 2️⃣ Delete removed recent records
      for (const rec of removedRecordsState) {
        await axios.delete(`${API_BASE_URL}/delete-item/${rec.RecordID}`, {
          headers,
          params: { "x-patient-id": editingPatient.PatientID },
        });
      }
  
      // 3️⃣ Delete removed x-ray records
      for (const xray of removedXrayRecords) {
        await axios.delete(`${API_BASE_URL}/delete-item/${xray.RecordID}`, {
          headers,
          params: { "x-patient-id": editingPatient.PatientID },
        });
      }
  
      // 4️⃣ Update remaining active prescriptions
      for (const prescription of editingPatient.activePrescriptions) {
        await axios.put(`${API_BASE_URL}/update-prescription`, prescription, { headers });
      }
  
      // 5️⃣ Update remaining recent records
      for (const record of editingPatient.recentRecords) {
        await axios.put(`${API_BASE_URL}/update-record`, record, { headers });
      }
  
      // 6️⃣ Update remaining x-ray records
      for (const xray of editingPatient.xrayRecords) {
        await axios.put(`${API_BASE_URL}/update-xray`, xray, { headers });
      }
  
      // 7️⃣ Update the PROFILE data (if needed)
      const profileUpdateData = {
        PatientID: editingPatient.PatientID,
        FullName: editingPatient.FullName,
        Age: editingPatient.Age,
        BloodType: editingPatient.BloodType,
        Weight: editingPatient.Weight,
        Username: editingPatient.Username,
      };
  
      await axios.put(`${API_BASE_URL}/update-patient`, profileUpdateData, { headers });
  
      // Refresh data and clear editing state
      fetchAggregatedProfiles();
      setEditingPatient(null);
      // Clear removed items
      setRemovedPrescriptions([]);
      setRemovedRecordsState([]);
      setRemovedXrayRecords([]);
    } catch (err) {
      console.error("Error updating patient:", err);
      setError("Failed to update patient.");
    }
  };
  
  

  const handleDeletePatient = async (PatientID) => {
    try {
      const headers = { "x-role": "doctor" };
      await axios.delete(`${API_BASE_URL}/delete-patient/${PatientID}`, { headers });
      fetchAggregatedProfiles();
    } catch (err) {
      console.error("Error deleting patient:", err);
      setError("Failed to delete patient.");
    }
  };

  // Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = aggregatedProfiles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(aggregatedProfiles.length / itemsPerPage);

  // Logout function
  const handleLogout = async () => {
    const clientId = "7rfb69gglntu7klpdq77i9asau";
    const logoutUri = "http://localhost:3000/";
    const cognitoDomain =
      "https://us-east-24tftlwzgp.auth.us-east-2.amazoncognito.com";
    localStorage.clear();
    sessionStorage.clear();
    await auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-[#71b5aa] p-4 flex justify-between items-center shadow-md">
        <div className="text-white text-2xl font-bold">
          <img src="/logo.png" alt="MedPortal" className="h-10 inline-block mr-2" />
          MedPortal
        </div>
        <div className="relative">
          <button
            className="flex items-center text-white text-lg focus:outline-none"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <UserCircleIcon className="h-8 w-8 mr-2" />
            {userData ? userData["cognito:username"] || "Doctor" : "Doctor"}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md">
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                <LogoutIcon className="h-5 w-5 inline-block mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Doctor Dashboard</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Patient Table */}
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-[#71b5aa] text-white">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Age</th>
                <th className="p-3 text-left">Blood Type</th>
                <th className="p-3 text-left">Weight</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Active Prescriptions</th>
                <th className="p-3 text-left">Recent Records</th>
                <th className="p-3 text-left">X-Ray Records</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((agg) => {
                  const profile = agg.profile;
                  const isEditing =
                    editingPatient && editingPatient.PatientID === profile.PatientID;
                  return (
                    <tr key={agg.PatientID} className="border-t">
                      {isEditing ? (
                        <>
                          <td className="p-3">
                            <input
                              type="text"
                              value={editingPatient.FullName}
                              onChange={(e) =>
                                setEditingPatient({ ...editingPatient, FullName: e.target.value })
                              }
                              className="w-full border p-1 rounded"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={editingPatient.Age}
                              onChange={(e) =>
                                setEditingPatient({ ...editingPatient, Age: e.target.value })
                              }
                              className="w-full border p-1 rounded"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={editingPatient.BloodType}
                              onChange={(e) =>
                                setEditingPatient({ ...editingPatient, BloodType: e.target.value })
                              }
                              className="w-full border p-1 rounded"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={editingPatient.Weight}
                              onChange={(e) =>
                                setEditingPatient({ ...editingPatient, Weight: e.target.value })
                              }
                              className="w-full border p-1 rounded"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="email"
                              value={editingPatient.Username}
                              onChange={(e) =>
                                setEditingPatient({ ...editingPatient, Username: e.target.value })
                              }
                              className="w-full border p-1 rounded"
                            />
                          </td>
                          {/* Editable Active Prescriptions */}
                          <td className="p-3">
                            <div className="max-h-32 overflow-y-auto space-y-2">
                              {editingPatient.activePrescriptions.map((presc, idx) => (
                                <div key={idx} className="flex items-center space-x-1 text-xs">
                                  <input
                                    type="text"
                                    className="border p-1 w-1/2"
                                    value={presc.Name}
                                    onChange={(e) =>
                                      handlePrescLineChange(idx, "Name", e.target.value)
                                    }
                                  />
                                  <input
                                    type="text"
                                    className="border p-1 w-1/2"
                                    value={presc.Dosage}
                                    onChange={(e) =>
                                      handlePrescLineChange(idx, "Dosage", e.target.value)
                                    }
                                  />
                                  <button onClick={() => removePrescLine(idx)} className="text-red-500 ml-1">
                                    x
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                          {/* Editable Recent Records */}
                          <td className="p-3">
                            <div className="max-h-32 overflow-y-auto space-y-2">
                              {editingPatient.recentRecords.map((rec, idx) => (
                                <div key={idx} className="flex items-center space-x-1 text-xs">
                                  <input
                                    type="text"
                                    className="border p-1 w-1/2"
                                    value={rec.Diagnosis}
                                    onChange={(e) =>
                                      handleRecordLineChange(idx, "Diagnosis", e.target.value)
                                    }
                                  />
                                  <input
                                    type="text"
                                    className="border p-1 w-1/2"
                                    value={rec.Date}
                                    onChange={(e) =>
                                      handleRecordLineChange(idx, "Date", e.target.value)
                                    }
                                  />
                                  <button onClick={() => removeRecordLine(idx)} className="text-red-500 ml-1">
                                    x
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                          {/* Editable X-Ray Records */}
                          <td className="p-3">
                            <div className="max-h-32 overflow-y-auto space-y-2">
                              {editingPatient.xrayRecords.map((xray, idx) => (
                                <div key={idx} className="flex items-center space-x-1 text-xs">
                                  <input
                                    type="text"
                                    className="border p-1 w-1/3"
                                    value={xray.RecordID}
                                    onChange={(e) =>
                                      handleXrayLineChange(idx, "RecordID", e.target.value)
                                    }
                                  />
                                  <input
                                    type="text"
                                    className="border p-1 w-1/3"
                                    value={xray.FileName}
                                    onChange={(e) =>
                                      handleXrayLineChange(idx, "FileName", e.target.value)
                                    }
                                  />
                                  <input
                                    type="text"
                                    className="border p-1 w-1/3"
                                    value={xray.Prediction}
                                    onChange={(e) =>
                                      handleXrayLineChange(idx, "Prediction", e.target.value)
                                    }
                                  />
                                  <button onClick={() => removeXrayLine(idx)} className="text-red-500 ml-1">
                                    x
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPatient(null)}
                              className="bg-gray-600 text-white px-3 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3">{profile?.FullName || "N/A"}</td>
                          <td className="p-3">{profile?.Age || "N/A"}</td>
                          <td className="p-3">{profile?.BloodType || "N/A"}</td>
                          <td className="p-3">{profile?.Weight || "N/A"}</td>
                          <td className="p-3">{profile?.Username || "N/A"}</td>
                          <td className="p-3">
                            {agg.activePrescriptions?.length
                              ? agg.activePrescriptions.map((p, i) => (
                                  <div key={i}>
                                    {p.Name} - {p.Dosage}
                                  </div>
                                ))
                              : "N/A"}
                          </td>
                          <td className="p-3">
                            {agg.recentRecords?.length
                              ? agg.recentRecords.map((r, i) => (
                                  <div key={i}>
                                    {r.Diagnosis} - {r.Date}
                                  </div>
                                ))
                              : "N/A"}
                          </td>
                          <td className="p-3">
                            {agg.xrayRecords?.length
                              ? agg.xrayRecords.map((x, i) => (
                                  <div key={i}>
                                    {x.RecordID}: {x.Prediction}
                                  </div>
                                ))
                              : "N/A"}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleEditPatient(profile, agg)}
                              className="bg-gray-300 hover:bg-gray-400 text-black p-2 rounded mr-2"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeletePatient(agg.PatientID)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="p-3 text-center">
                    No patient profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="mr-2">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border p-1 rounded"
            >
              <option value={5}>5</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded mr-2"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, totalPages)
                )
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded ml-2"
            >
              Next
            </button>
          </div>
        </div>

        {/* New Sections: side by side forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add New Prescription */}
          <section className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Add New Prescription</h3>
            <form onSubmit={handleAddPrescription}>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">
                  Select Patient:
                </label>
                <select
                  name="PatientID"
                  value={newPrescription.PatientID}
                  onChange={(e) =>
                    setNewPrescription({
                      ...newPrescription,
                      PatientID: e.target.value,
                    })
                  }
                  className="w-full border p-1 rounded text-sm"
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {aggregatedProfiles.map((agg) => (
                    <option key={agg.PatientID} value={agg.PatientID}>
                      {agg.profile?.FullName || agg.PatientID}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">
                  Prescription Name:
                </label>
                <input
                  type="text"
                  name="Name"
                  value={newPrescription.Name}
                  onChange={handlePrescriptionChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">Dosage:</label>
                <input
                  type="text"
                  name="Dosage"
                  value={newPrescription.Dosage}
                  onChange={handlePrescriptionChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <button type="submit" className="bg-[#71b5aa] text-white py-1 px-2 rounded w-full text-sm">
                Add Prescription
              </button>
            </form>
          </section>

          {/* Add New Record */}
          <section className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Add New Record</h3>
            <form onSubmit={handleAddRecord}>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">
                  Select Patient:
                </label>
                <select
                  name="PatientID"
                  value={newRecord.PatientID}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, PatientID: e.target.value })
                  }
                  className="w-full border p-1 rounded text-sm"
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {aggregatedProfiles.map((agg) => (
                    <option key={agg.PatientID} value={agg.PatientID}>
                      {agg.profile?.FullName || agg.PatientID}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">Diagnosis:</label>
                <input
                  type="text"
                  name="Diagnosis"
                  value={newRecord.Diagnosis}
                  onChange={handleRecordChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">
                  Date (YYYY-MM-DD):
                </label>
                <input
                  type="text"
                  name="Date"
                  value={newRecord.Date}
                  onChange={handleRecordChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <button type="submit" className="bg-[#71b5aa] text-white py-1 px-2 rounded w-full text-sm">
                Add Record
              </button>
            </form>
          </section>

          {/* Add New Patient */}
          <section className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Add New Patient</h3>
            <form onSubmit={handleAddPatient}>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">Name:</label>
                <input
                  type="text"
                  name="FullName"
                  value={newPatient.FullName}
                  onChange={handleInputChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">Age:</label>
                <input
                  type="number"
                  name="Age"
                  value={newPatient.Age}
                  onChange={handleInputChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">Blood Type:</label>
                <input
                  type="text"
                  name="BloodType"
                  value={newPatient.BloodType}
                  onChange={handleInputChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">Weight:</label>
                <input
                  type="text"
                  name="Weight"
                  value={newPatient.Weight}
                  onChange={handleInputChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">Email:</label>
                <input
                  type="email"
                  name="Email"
                  value={newPatient.Email}
                  onChange={handleInputChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-gray-700 text-sm">Username:</label>
                <input
                  type="text"
                  name="Username"
                  value={newPatient.Username}
                  onChange={handleInputChange}
                  className="w-full border p-1 rounded text-sm"
                  required
                />
              </div>
              <button type="submit" className="bg-[#71b5aa] text-white py-1 px-2 rounded w-full text-sm">
                Add Patient
              </button>
            </form>
          </section>

          {/* X-Ray Upload & Analysis */}
          <section className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">X-Ray Analysis</h3>
            <div className="mb-2">
              <label className="block text-gray-700 text-sm">Select Patient:</label>
              <select
                value={selectedXrayPatient}
                onChange={(e) => setSelectedXrayPatient(e.target.value)}
                className="w-full border p-1 rounded text-sm"
                required
              >
                <option value="">-- Select Patient --</option>
                {aggregatedProfiles.map((agg) => (
                  <option key={agg.PatientID} value={agg.PatientID}>
                    {agg.profile?.FullName || agg.PatientID}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-dashed border-2 border-gray-300 p-4 text-center">
              <CloudUploadIcon className="w-8 h-8 mx-auto text-gray-500" />
              <p className="text-gray-500 text-sm mt-1">
                Drop your chest X-Ray here or click to upload
              </p>
              <input
                type="file"
                onChange={(e) => setXrayFile(e.target.files[0])}
                className="mt-2 border p-1 rounded text-sm"
              />
              <button
                onClick={handleXrayUpload}
                className="mt-2 bg-[#71b5aa] text-white py-1 px-2 rounded text-sm"
              >
                Upload X-Ray
              </button>
            </div>
            {xrayLoading && (
              <p className="text-gray-500 text-sm mt-2">Analyzing X-Ray...</p>
            )}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {xrayAnalysis && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg shadow-inner text-sm">
                <h4 className="font-semibold">Analysis Result</h4>
                <p>
                  <strong>Condition:</strong> {xrayAnalysis.prediction}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 mt-6 text-center">
        <p>© 2025 MedPortal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default DoctorDashboard;
