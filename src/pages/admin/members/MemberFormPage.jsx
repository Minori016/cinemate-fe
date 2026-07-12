import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { memberService } from '../../../services/memberService'
import {
  ArrowLeft, User, Eye, EyeOff, CheckCircle, XCircle,
  Info, UserPlus, Save, X, Star, Hash, AtSign, Mail, Phone,
  Calendar, CreditCard, MapPin, Sparkles, BadgeCheck, ShieldCheck, FileText,
  AlertTriangle, Lock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

function FieldInput({ label, required, error, icon: Icon, children, hint }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 mb-1.5">
        {Icon && <Icon size={11} strokeWidth={3} className="text-slate-700" />}
        {label}
        {required && <span className="text-rose-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[10px] font-bold text-rose-700 mt-1 uppercase tracking-wider">
          <AlertTriangle size={10} strokeWidth={3} /> {error}
        </p>
      ) : hint ? (
        <p className="text-[10px] font-bold text-slate-500 mt-1">{hint}</p>
      ) : null}
    </div>
  )
}

function BrutalInput({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-white border-2 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-amber-50 transition-all ${
        error ? 'border-rose-600 focus:border-rose-600' : 'border-slate-200 focus:border-slate-900'
      } ${props.className || ''}`}
    />
  )
}

function BrutalSelect({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full bg-white border-2 rounded-xl py-2.5 px-3 text-sm font-bold text-slate-900 focus:outline-none focus:bg-amber-50 transition-all cursor-pointer ${
        error ? 'border-rose-600 focus:border-rose-600' : 'border-slate-200 focus:border-slate-900'
      } ${props.className || ''}`}
    >
      {children}
    </select>
  )
}

export default function MemberFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  const formRef = useRef(null)

  const [form, setForm] = useState({
    username: '', email: '', fullName: '', dateOfBirth: '',
    gender: 'MALE', phoneNumber: '',
    identityCard: '', address: '',
    password: '', confirmPassword: '', status: 'ACTIVE',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (isEditMode) {
      memberService.getById(id)
        .then(res => {
          const m = res.data?.result || res.data
          if (m) {
            setForm({
              username: m.username || '', email: m.email || '',
              fullName: m.fullName || '',
              dateOfBirth: m.dateOfBirth || m.dayOfBirth || '',
              gender: m.gender ? m.gender.toUpperCase() : 'MALE',
              phoneNumber: m.phoneNumber || '',
              identityCard: m.identityCard || '',
              address: m.address || '',
              status: m.status || 'ACTIVE',
              password: '', confirmPassword: '',
            })
            setDataLoaded(true)
          }
        })
        .catch(() => showToast('Khong the tai thong tin thanh vien', 'danger'))
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDataLoaded(true)
    }
  }, [id, isEditMode])

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Tai khoan khong duoc de trong'
    if (!form.email.trim()) errs.email = 'Email khong duoc de trong'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Email khong hop le'
    if (!form.fullName.trim()) errs.fullName = 'Ho ten khong duoc de trong'
    if (!form.dateOfBirth) errs.dateOfBirth = 'Ngay sinh khong duoc de trong'
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'SDT khong duoc de trong'
    if (!form.identityCard.trim()) errs.identityCard = 'CMND/CCCD khong duoc de trong'
    if (!form.address.trim()) errs.address = 'Dia chi khong duoc de trong'
    if (!isEditMode) {
      if (!form.password) errs.password = 'Mat khau khong duoc de trong'
      else if (form.password.length < 8) errs.password = 'Mat khau toi thieu 8 ky tu'
      else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(form.password)) {
        errs.password = 'Mat khau phai co chu hoa, thuong, so va ky tu dac biet'
      }
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mat khau xac nhan khong khop'
    } else if (form.password) {
      if (form.password.length < 8) errs.password = 'Mat khau toi thieu 8 ky tu'
      else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(form.password)) {
        errs.password = 'Mat khau phai co chu hoa, thuong, so va ky tu dac biet'
      }
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mat khau xac nhan khong khop'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      showToast('Vui long kiem tra lai thong tin nhap lieu.', 'danger')
      return
    }
    setIsSubmitting(true)
    const data = {
      username: form.username.trim(),
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      dayOfBirth: form.dateOfBirth,
      gender: form.gender,
      phoneNumber: form.phoneNumber.trim(),
      identityCard: form.identityCard.trim(),
      address: form.address.trim(),
      ...(form.password ? { password: form.password, confirmPassword: form.confirmPassword } : {}),
      ...(isEditMode ? { status: form.status } : {}),
    }
    try {
      if (isEditMode) await memberService.update(id, data)
      else await memberService.register(data)
      showToast(isEditMode ? 'Cap nhat thanh vien thanh cong!' : 'Them thanh vien moi thanh cong!', 'success')
      setTimeout(() => navigate('/admin/members'), 1600)
    } catch (err) {
      console.error('Save error:', err.response?.data)
      const errCode = err.response?.data?.code
      const errMsg = err.response?.data?.message || err.message || 'Loi he thong'
      if (errCode === 1007) showToast('Ban khong co quyen thuc hien thao tac nay', 'danger')
      else if (errCode === 1002) showToast('Tai khoan hoac email da ton tai trong he thong', 'danger')
      else if (errCode === 1004) showToast('Mat khau phai co it nhat 8 ky tu', 'danger')
      else if (errCode === 1012) showToast('Mat khau phai co chu hoa, thuong, so va ky tu dac biet', 'danger')
      else showToast(`Khong the luu: ${errMsg}`, 'danger')
      setIsSubmitting(false)
    }
  }

  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin" />
          <p className="text-sm font-black uppercase tracking-wider text-slate-700">Dang tai...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1200px]">

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] max-w-md ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={20} strokeWidth={3} /> : <XCircle size={20} strokeWidth={3} />}
            <span className="text-sm font-black uppercase tracking-wider flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="hover:scale-110 transition-transform">
              <X size={16} strokeWidth={3} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PART_BACK_AND_HEADER */}
      <button
        onClick={() => navigate('/admin/members')}
        className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} strokeWidth={3} /> Quay lai Quan ly Thanh vien
      </button>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-sky-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 ${isEditMode ? 'bg-amber-500' : 'bg-violet-600'} border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]`}>
              {isEditMode ? <User size={26} className="text-white" strokeWidth={3} /> : <UserPlus size={26} className="text-white" strokeWidth={3} />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                  <Hash size={10} /> {isEditMode ? 'EDIT MODE' : 'NEW MEMBER'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 ${isEditMode ? 'bg-amber-500' : 'bg-violet-600'} text-white rounded-md text-[10px] font-black uppercase tracking-wider`}>
                  <BadgeCheck size={10} strokeWidth={3} /> {isEditMode ? 'CAP NHAT' : 'TAO MOI'}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-[0.95]">
                {isEditMode ? 'Cap nhat' : 'Them thanh vien'}<br /><span className="text-red-600">{isEditMode ? 'thanh vien' : 'moi'}</span>
              </h1>
              <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                {isEditMode ? 'Chinh sua thong tin tai khoan thanh vien.' : 'Tao tai khoan thanh vien moi voi thong tin ca nhan va quyen truy cap.'}
              </p>
            </div>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* PART_FORM */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">

          {/* LEFT - Form chính */}
          <div className="space-y-5">

            {/* Card: Tài khoản */}
            <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
              <div className="flex items-stretch border-b-2 border-slate-900">
                <div className="bg-violet-600 text-white px-4 py-3 flex items-center border-r-2 border-slate-900">
                  <AtSign size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 px-5 py-3 bg-violet-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Thong tin tai khoan</h2>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Ten dang nhap va mat khau</p>
                  </div>
                  <ShieldCheck size={20} className="text-slate-900" strokeWidth={2.5} />
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldInput label="Tai khoan" required error={errors.username} icon={AtSign}>
                    <BrutalInput
                      error={errors.username}
                      name="username"
                      type="text"
                      placeholder="mb001"
                      value={form.username}
                      onChange={e => update('username', e.target.value)}
                    />
                  </FieldInput>
                  <FieldInput label="Email" required error={errors.email} icon={Mail}>
                    <BrutalInput
                      error={errors.email}
                      name="email"
                      type="email"
                      placeholder="member@cinemate.com"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                    />
                  </FieldInput>
                </div>

                {(!isEditMode || form.password) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-dashed border-slate-200">
                    <FieldInput
                      label={isEditMode ? 'Mat khau moi' : 'Mat khau'}
                      required={!isEditMode}
                      error={errors.password}
                      icon={Lock}
                      hint={isEditMode ? 'De trong neu giu mat khau cu' : 'Toi thieu 8 ky tu, co chu hoa, thuong, so, ky tu dac biet'}
                    >
                      <div className="relative">
                        <BrutalInput
                          error={errors.password}
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={isEditMode ? 'De trong neu giu mat khau cu' : 'Toi thieu 8 ky tu'}
                          value={form.password}
                          onChange={e => update('password', e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                        >
                          {showPassword ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                        </button>
                      </div>
                    </FieldInput>
                    <FieldInput
                      label="Xac nhan mat khau"
                      required={!isEditMode}
                      error={errors.confirmPassword}
                      icon={Lock}
                    >
                      <div className="relative">
                        <BrutalInput
                          error={errors.confirmPassword}
                          name="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Nhap lai mat khau"
                          value={form.confirmPassword}
                          onChange={e => update('confirmPassword', e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                        >
                          {showConfirm ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                        </button>
                      </div>
                    </FieldInput>
                  </div>
                )}
              </div>
            </div>

            {/* Card: Thông tin cá nhân */}
            <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
              <div className="flex items-stretch border-b-2 border-slate-900">
                <div className="bg-emerald-500 text-white px-4 py-3 flex items-center border-r-2 border-slate-900">
                  <User size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 px-5 py-3 bg-emerald-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Thong tin ca nhan</h2>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Ho ten, ngay sinh, lien lac</p>
                  </div>
                  <FileText size={20} className="text-slate-900" strokeWidth={2.5} />
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldInput label="Ho ten" required error={errors.fullName} icon={User}>
                    <BrutalInput
                      error={errors.fullName}
                      name="fullName"
                      type="text"
                      placeholder="Nguyen Van A"
                      value={form.fullName}
                      onChange={e => update('fullName', e.target.value)}
                    />
                  </FieldInput>
                  <FieldInput label="Gioi tinh" required icon={User}>
                    <BrutalSelect name="gender" value={form.gender} onChange={e => update('gender', e.target.value)}>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nu</option>
                      <option value="OTHER">Khac</option>
                    </BrutalSelect>
                  </FieldInput>
                  <FieldInput label="Ngay sinh" required error={errors.dateOfBirth} icon={Calendar}>
                    <BrutalInput
                      error={errors.dateOfBirth}
                      name="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={e => update('dateOfBirth', e.target.value)}
                    />
                  </FieldInput>
                  <FieldInput label="So dien thoai" required error={errors.phoneNumber} icon={Phone}>
                    <BrutalInput
                      error={errors.phoneNumber}
                      name="phoneNumber"
                      type="tel"
                      placeholder="0901234567"
                      value={form.phoneNumber}
                      onChange={e => update('phoneNumber', e.target.value)}
                    />
                  </FieldInput>
                  <FieldInput label="So CMND / CCCD" required error={errors.identityCard} icon={CreditCard}>
                    <BrutalInput
                      error={errors.identityCard}
                      name="identityCard"
                      type="text"
                      placeholder="123456789012"
                      value={form.identityCard}
                      onChange={e => update('identityCard', e.target.value)}
                    />
                  </FieldInput>
                  <FieldInput label="Dia chi" required error={errors.address} icon={MapPin}>
                    <BrutalInput
                      error={errors.address}
                      name="address"
                      type="text"
                      placeholder="123 Duong ABC, Quan XYZ, TP.HCM"
                      value={form.address}
                      onChange={e => update('address', e.target.value)}
                    />
                  </FieldInput>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-6">

            {/* Card: Vai trò */}
            <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
              <div className="flex items-stretch border-b-2 border-slate-900">
                <div className="bg-fuchsia-600 text-white px-4 py-3 flex items-center border-r-2 border-slate-900">
                  <Star size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 px-5 py-3 bg-fuchsia-50 flex items-center justify-between">
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Vai tro</h2>
                  <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-violet-100 border-2 border-violet-700 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <div className="w-11 h-11 bg-violet-600 border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] shrink-0">
                    <Star size={18} className="text-white" strokeWidth={3} fill="white" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider text-violet-900 leading-tight">Thanh vien</p>
                    <p className="text-[10px] font-bold text-violet-700 mt-0.5">QUYEN HAN: MEMBER</p>
                  </div>
                </div>

                {isEditMode && (
                  <FieldInput label="Trang thai" icon={BadgeCheck}>
                    <BrutalSelect name="status" value={form.status} onChange={e => update('status', e.target.value)}>
                      <option value="ACTIVE">Hoat dong (ACTIVE)</option>
                      <option value="LOCKED">Bi khoa (LOCKED)</option>
                    </BrutalSelect>
                  </FieldInput>
                )}
              </div>
            </div>

            {/* Card: Actions */}
            <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
              <div className="p-5 space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] disabled:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] disabled:translate-x-0 disabled:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Dang luu...
                    </>
                  ) : (
                    <><Save size={14} strokeWidth={3} /> {isEditMode ? 'Cap nhat thanh vien' : 'Them thanh vien'}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/members')}
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <X size={14} strokeWidth={3} /> Huy bo
                </button>
              </div>
            </div>

            {/* Card: Lưu ý */}
            <div className="bg-amber-50 border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-900 bg-amber-100">
                <Info size={16} strokeWidth={3} className="text-amber-700" />
                <h3 className="font-black uppercase tracking-wider text-xs text-slate-900">Luu y</h3>
              </div>
              <ul className="p-4 space-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-start gap-2"><span className="text-amber-700 shrink-0">▸</span>{isEditMode ? 'Mat khau: de trong neu giu nguyen' : 'Mat khau toi thieu 8 ky tu'}</li>
                <li className="flex items-start gap-2"><span className="text-amber-700 shrink-0">▸</span>Mat khau phai co chu hoa, thuong, so va ky tu dac biet</li>
                <li className="flex items-start gap-2"><span className="text-amber-700 shrink-0">▸</span>Tai khoan va email phai la duy nhat</li>
                <li className="flex items-start gap-2"><span className="text-amber-700 shrink-0">▸</span>CMND/CCCD va dia chi la bat buoc</li>
                <li className="flex items-start gap-2"><span className="text-amber-700 shrink-0">▸</span>Thanh vien co quyen MEMBER</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}