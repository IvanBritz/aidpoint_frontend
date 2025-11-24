import { useEffect, useState } from 'react'

const BeneficiaryEditModal = ({ isOpen, initial, onSave, onClose }) => {
    const [form, setForm] = useState(initial || {})

    useEffect(() => {
        setForm(initial || {})
    }, [initial])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 mx-auto mt-24 w-full max-w-2xl px-4">
                <div className="bg-white rounded-xl shadow-xl ring-1 ring-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Edit Beneficiary</h3>
                        <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" aria-label="Close">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-600">First name</label>
                            <input className="border rounded p-2 w-full" value={form.firstname || ''} onChange={e=>setForm({...form, firstname:e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Last name</label>
                            <input className="border rounded p-2 w-full" value={form.lastname || ''} onChange={e=>setForm({...form, lastname:e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Middle name</label>
                            <input className="border rounded p-2 w-full" value={form.middlename || ''} onChange={e=>setForm({...form, middlename:e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Contact</label>
                            <input className="border rounded p-2 w-full" value={form.contact_number || ''} onChange={e=>setForm({...form, contact_number:e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-600">Address</label>
                            <input className="border rounded p-2 w-full" value={form.address || ''} onChange={e=>setForm({...form, address:e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Birthdate</label>
                            <input type="date" className="border rounded p-2 w-full" value={form.birthdate || ''} onChange={e=>setForm({...form, birthdate:e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Enrolled School</label>
                            <input className="border rounded p-2 w-full" value={form.enrolled_school || ''} onChange={e=>setForm({...form, enrolled_school:e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">School Year</label>
                            <input className="border rounded p-2 w-full" value={form.school_year || ''} onChange={e=>setForm({...form, school_year:e.target.value})} />
                        </div>
                        {/* Note: caseworkers cannot change email/status; directors can, but this modal is used in staff dashboard */}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-right">
                        <button onClick={onClose} className="mr-3 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2">Cancel</button>
                        <button onClick={()=>onSave(form)} className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2">Save</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BeneficiaryEditModal
