import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Target, GraduationCap, Award, Link as LinkIcon, Plus, Pencil, Check, X } from 'lucide-react';
import { CareerProfile } from '../../types/index.js';

interface PersonalProfileViewProps {
  lang: 'en' | 'ar';
  profile: CareerProfile;
  onUpdateProfile: (updates: Partial<CareerProfile>) => Promise<void>;
}

export function PersonalProfileView({ lang, profile, onUpdateProfile }: PersonalProfileViewProps) {
  const isAr = lang === 'ar';
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<CareerProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert(isAr ? 'فشل في حفظ الملف الشخصي' : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#17253B]">
              {isAr ? 'الملف الشخصي' : 'Personal Profile'}
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              {isAr ? 'معلوماتك المهنية وبيانات السيرة الذاتية' : 'Your professional information and CV data'}
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
            >
              <Pencil size={16} />
              {isAr ? 'تعديل' : 'Edit'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#15803D] text-white rounded-lg hover:bg-[#166534] transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                {isAr ? 'حفظ' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300 transition-colors"
              >
                <X size={16} />
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-[#E4EAF2] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#17253B] flex items-center gap-2">
            <User size={20} className="text-[#2563EB]" />
            {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'الاسم الكامل' : 'Full Name'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.fullName || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              ) : (
                <p className="text-[#17253B]">{profile.fullName || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'البريد الإلكتروني' : 'Email'}
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedProfile.email || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              ) : (
                <p className="text-[#17253B] flex items-center gap-2">
                  <Mail size={16} className="text-[#64748B]" />
                  {profile.email || '-'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'الموقع' : 'Location'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.location || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              ) : (
                <p className="text-[#17253B] flex items-center gap-2">
                  <MapPin size={16} className="text-[#64748B]" />
                  {profile.location || '-'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Career Information */}
        <div className="bg-white rounded-xl border border-[#E4EAF2] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#17253B] flex items-center gap-2">
            <Briefcase size={20} className="text-[#2563EB]" />
            {isAr ? 'المعلومات المهنية' : 'Career Information'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'المسمى الوظيفي' : 'Headline'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.headline || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, headline: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              ) : (
                <p className="text-[#17253B]">{profile.headline || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'الوظيفة المستهدفة' : 'Target Role'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.targetRole || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, targetRole: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                />
              ) : (
                <p className="text-[#17253B] flex items-center gap-2">
                  <Target size={16} className="text-[#64748B]" />
                  {profile.targetRole || '-'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'الحالة المهنية' : 'Career Status'}
              </label>
              <p className="text-[#17253B]">
                {profile.careerStatus === 'student' && (isAr ? 'طالب' : 'Student')}
                {profile.careerStatus === 'fresh_graduate' && (isAr ? 'خريج حديث' : 'Fresh Graduate')}
                {profile.careerStatus === 'experienced_professional' && (isAr ? 'محترف' : 'Experienced Professional')}
                {profile.careerStatus === 'career_changer' && (isAr ? 'تحويل مسار مهني' : 'Career Changer')}
              </p>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-[#E4EAF2] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#17253B] flex items-center gap-2">
            <Award size={20} className="text-[#2563EB]" />
            {isAr ? 'المهارات' : 'Skills'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                >
                  {typeof skill === 'string' ? skill : skill.canonicalName}
                </span>
              ))
            ) : (
              <p className="text-[#64748B] text-sm">
                {isAr ? 'لا توجد مهارات بعد. قم برفع سيرتك الذاتية لاستخراج المهارات.' : 'No skills yet. Upload your CV to extract skills.'}
              </p>
            )}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-xl border border-[#E4EAF2] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#17253B] flex items-center gap-2">
            <Briefcase size={20} className="text-[#2563EB]" />
            {isAr ? 'الخبرة العملية' : 'Work Experience'}
          </h2>
          {profile.experience && profile.experience.length > 0 ? (
            <div className="space-y-4">
              {profile.experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-[#2563EB] pl-4">
                  <h3 className="font-semibold text-[#17253B]">{exp.role}</h3>
                  <p className="text-[#64748B] text-sm">{exp.company}</p>
                  <p className="text-[#94A3B8] text-xs">{exp.startDate} - {exp.endDate || (isAr ? 'حتى الآن' : 'Present')}</p>
                  {exp.responsibilities && exp.responsibilities.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-[#475569]">
                      {exp.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#2563EB] mt-1">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#64748B] text-sm">
              {isAr ? 'لا توجد خبرة عملية بعد. قم برفع سيرتك الذاتية لاستخراج الخبرة.' : 'No work experience yet. Upload your CV to extract experience.'}
            </p>
          )}
        </div>

        {/* Education */}
        <div className="bg-white rounded-xl border border-[#E4EAF2] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#17253B] flex items-center gap-2">
            <GraduationCap size={20} className="text-[#2563EB]" />
            {isAr ? 'التعليم' : 'Education'}
          </h2>
          {profile.education && profile.education.length > 0 ? (
            <div className="space-y-4">
              {profile.education.map((edu, idx) => (
                <div key={idx} className="border-l-2 border-[#15803D] pl-4">
                  <h3 className="font-semibold text-[#17253B]">{edu.degree} {edu.field && `- ${edu.field}`}</h3>
                  <p className="text-[#64748B] text-sm">{edu.institution}</p>
                  <p className="text-[#94A3B8] text-xs">{edu.startDate} - {edu.endDate || (isAr ? 'حتى الآن' : 'Present')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#64748B] text-sm">
              {isAr ? 'لا توجد معلومات تعليمية بعد. قم برفع سيرتك الذاتية لاستخراج التعليم.' : 'No education information yet. Upload your CV to extract education.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
