import React, { useEffect, useState } from 'react';
import {
  Search, Filter, Plus, Eye, ChevronLeft, ChevronRight, X, CheckCircle2,
  XCircle, Clock, Building2, Phone, Mail, FileText, ShieldCheck, RefreshCw,
  Award, Briefcase, MapPin, CreditCard
} from 'lucide-react';

export const GovernmentVendors: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Status Action
  const [updating, setUpdating] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Register vendor form
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [specialization, setSpecialization] = useState('Road Maintenance');
  const [registering, setRegistering] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter,
        page: page.toString(),
        page_size: '10',
      });
      const res = await fetch(`/api/government/vendors?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setVendors(json.vendors || []);
        setTotal(json.total || 0);
        setTotalPages(json.total_pages || 1);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, statusFilter, categoryFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchVendors();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleUpdateStatus = async (vendorId: number, newStatus: string) => {
    setUpdating(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/government/vendors/${vendorId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg({ type: 'success', text: `Vendor marked as ${newStatus}` });
        setVendors((prev) =>
          prev.map((v) => (v.id === vendorId ? { ...v, status: newStatus } : v))
        );
        if (selectedVendor) {
          setSelectedVendor((prev: any) => ({ ...prev, status: newStatus }));
        }
        setTimeout(() => {
          setSelectedVendor(null);
          setActionMsg(null);
        }, 1200);
      } else {
        throw new Error(json.message || 'Operation failed');
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to update vendor status' });
    } finally {
      setUpdating(false);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          contact_person: contactPerson,
          email,
          mobile,
          password: 'Password@123',
          gst_number: gstNumber,
          pan_number: panNumber,
          specialization,
          location: 'Pune, Maharashtra',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsRegisterModalOpen(false);
        setCompanyName('');
        setContactPerson('');
        setEmail('');
        setMobile('');
        setGstNumber('');
        setPanNumber('');
        fetchVendors();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'rejected') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const statusTabs = ['All', 'Approved', 'Pending Review', 'Rejected'];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Vendor Management</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            View and manage registered vendors and their details.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vendor</span>
          </button>
          <button
            onClick={fetchVendors}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by vendor name, GST, PAN or category..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-800"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Categories</option>
              <option value="Road Maintenance">Road Maintenance</option>
              <option value="Street Lighting">Street Lighting</option>
              <option value="Water Infrastructure">Water Infrastructure</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Smart City & IoT">Smart City & IoT</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setStatusFilter(tab); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-amber-100 text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
          <span className="text-[11px] text-slate-400 font-medium ml-auto">
            Showing {vendors.length} of {total} vendors
          </span>
        </div>
      </div>

      {/* VENDORS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3">GST No.</th>
                <th className="px-4 py-3">PAN No.</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                      <span>Loading vendor records...</span>
                    </div>
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No registered vendors matching criteria.
                  </td>
                </tr>
              ) : (
                vendors.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-medium">
                      {(page - 1) * 10 + idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{v.company_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{v.contact_person}</span>
                        {v.vendor_id && <span>• ID: {v.vendor_id}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px]">{v.gst_number}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px]">{v.pan_number}</td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{v.category}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedVendor(v)}
                        className="w-7 h-7 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-600 transition-colors"
                        title="View Profile & Manage"
                      >
                        <Eye className="w-4 h-4 text-slate-500 hover:text-amber-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
          <span className="text-slate-500 font-medium">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* VENDOR PROFILE MODAL */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white font-black text-xl flex items-center justify-center shadow-sm shadow-amber-200">
                  {selectedVendor.company_name[0] || 'V'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{selectedVendor.company_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedVendor.status)}`}>
                      {selectedVendor.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedVendor.category} • ID: {selectedVendor.vendor_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedVendor(null); setActionMsg(null); }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {actionMsg && (
                <div
                  className={`p-3 rounded-xl font-semibold flex items-center gap-2 ${
                    actionMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                  <span>{actionMsg.text}</span>
                </div>
              )}

              {/* Contact Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedVendor.contact_person}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                  <div className="font-bold text-slate-800 mt-0.5 truncate">{selectedVendor.email}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedVendor.mobile}</div>
                </div>
              </div>

              {/* Tax & Registration Credentials */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Statutory Registrations
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">GST Identification No.</span>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedVendor.gst_number}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Permanent Account No. (PAN)</span>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedVendor.pan_number}</div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Business Address
                </span>
                <div className="font-medium text-slate-700">
                  {selectedVendor.business_address || `${selectedVendor.city || 'Pune'}, ${selectedVendor.state || 'Maharashtra'} - ${selectedVendor.pincode || '411038'}`}
                </div>
              </div>

              {/* Banking Details */}
              {selectedVendor.bank_name && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600" /> Bank Account Details
                  </h4>
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Bank</span>
                      <div className="font-bold text-slate-800">{selectedVendor.bank_name}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">A/C Number</span>
                      <div className="font-mono font-bold text-slate-800">{selectedVendor.account_number || '••••••••'}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">IFSC</span>
                      <div className="font-mono font-bold text-slate-800">{selectedVendor.ifsc_code || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* APPROVAL WORKFLOW ACTION */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-slate-500 text-[11px]">
                  Registered on: <span className="font-semibold text-slate-700">{selectedVendor.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedVendor.id, 'Rejected')}
                    disabled={updating || selectedVendor.status === 'Rejected'}
                    className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedVendor.id, 'Approved')}
                    disabled={updating || selectedVendor.status === 'Approved'}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Vendor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER VENDOR MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Register New Vendor</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterVendor} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Pune Infra Projects Ltd"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Contact Person</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Rajesh Patil"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@infra.com"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">GST Number</label>
                  <input
                    type="text"
                    required
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="27AABCS1429B1Z1"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">PAN Number</label>
                  <input
                    type="text"
                    required
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="AABCS1429B"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Category / Specialization</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Road Maintenance">Road Maintenance</option>
                  <option value="Street Lighting">Street Lighting</option>
                  <option value="Water Infrastructure">Water Infrastructure</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Smart City & IoT">Smart City & IoT</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md"
                >
                  {registering ? 'Registering...' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
