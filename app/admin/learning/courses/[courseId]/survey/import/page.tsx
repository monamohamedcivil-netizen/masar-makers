"use client";

import { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Save, Star } from "lucide-react";
import Link from "next/link";

import { createImportedStudentSurvey } from "@/lib/actions/admin/student-surveys";

export default function ImportStudentSurveyPage() {
  const router = useRouter();

  const params = useParams();

  const courseId = params.courseId as string;

  const [pending, startTransition] = useTransition();

  const [studentName, setStudentName] = useState("");

  const [studentEmail, setStudentEmail] = useState("");
const [studentJobTitle, setStudentJobTitle] =
  useState("");

const [studentCountry, setStudentCountry] =
  useState("");
  const [rating, setRating] = useState(5);

  const [comment, setComment] = useState("");

  const [generalSurveyCompleted, setGeneralSurveyCompleted] =
    useState(true);

  const [detailedSurveyCompleted, setDetailedSurveyCompleted] =
    useState(true);

  const [showOnHome, setShowOnHome] =
    useState(true);

  const [showOnCourse, setShowOnCourse] =
    useState(true);

  const [sourceReference, setSourceReference] =
    useState("Google Form");

  const [message, setMessage] = useState("");

  function saveSurvey() {
    setMessage("");

    startTransition(async () => {
      const result =
        await createImportedStudentSurvey({
          studentName,
          studentEmail,
          studentJobTitle,

studentCountry,
          courseId,

          rating,

          comment,

          generalSurveyCompleted,

          detailedSurveyCompleted,

          showOnHome,

          showOnCourse,

          sourceReference,
        });

      setMessage(result.message);

      if (result.success) {
        router.push(
          `/admin/learning/courses/${courseId}?tab=survey`
        );
      }
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-black text-[#07152E]">
            إضافة تقييم سابق
          </h1>

          <p className="mt-2 text-slate-500">
            سيتم إضافة التقييم مباشرة إلى قاعدة البيانات.
          </p>

        </div>

        <Link
          href={`/admin/learning/courses/${courseId}?tab=survey`}
          className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold"
        >
          <ArrowRight size={18} />
          رجوع
        </Link>

      </div>

      <div className="rounded-3xl border bg-white p-8 space-y-8">

       <div className="grid md:grid-cols-2 gap-5">

  <div>

    <label className="font-black">
      اسم الطالب
    </label>

    <input
      value={studentName}
      onChange={(e)=>setStudentName(e.target.value)}
      className="mt-2 h-12 w-full rounded-xl border px-4"
    />

  </div>

  <div>

    <label className="font-black">
      البريد الإلكتروني
    </label>

    <input
      value={studentEmail}
      onChange={(e)=>setStudentEmail(e.target.value)}
      className="mt-2 h-12 w-full rounded-xl border px-4"
    />

  </div>

  <div>

    <label className="font-black">
      المهنة
    </label>

    <input
      value={studentJobTitle}
      onChange={(e)=>setStudentJobTitle(e.target.value)}
      className="mt-2 h-12 w-full rounded-xl border px-4"
      placeholder="مثال: مهندس تصميم طرق"
    />

  </div>

  <div>

    <label className="font-black">
      البلد
    </label>

    <input
      value={studentCountry}
      onChange={(e)=>setStudentCountry(e.target.value)}
      className="mt-2 h-12 w-full rounded-xl border px-4"
      placeholder="مثال: السعودية"
    />

  </div>

</div>

        <div>

          <label className="font-black">
            عدد النجوم
          </label>

          <div className="mt-3 flex gap-2">

            {Array.from({length:5}).map((_,index)=>{

              const value=index+1;

              return(

                <button

                  key={value}

                  onClick={()=>setRating(value)}

                  type="button"

                >

                  <Star

                    size={32}

                    fill={
                      value<=rating
                        ? "currentColor"
                        : "none"
                    }

                    className="text-[#F7B548]"

                  />

                </button>

              );

            })}

          </div>

        </div>

        <div>

          <label className="font-black">
            التعليق
          </label>

          <textarea

            rows={6}

            value={comment}

            onChange={(e)=>setComment(e.target.value)}

            className="mt-2 w-full rounded-xl border p-4"

          />

        </div>

        <div>

          <label className="font-black">
            مصدر التقييم
          </label>

          <select

            value={sourceReference}

            onChange={(e)=>setSourceReference(e.target.value)}

            className="mt-2 h-12 w-full rounded-xl border px-4"

          >

            <option>Google Form</option>

            <option>WhatsApp</option>

            <option>Email</option>

            <option>LinkedIn</option>

            <option>Platform</option>

          </select>

        </div>

        <div className="grid md:grid-cols-2 gap-3">

          <label>
            <input
              type="checkbox"
              checked={generalSurveyCompleted}
              onChange={(e)=>setGeneralSurveyCompleted(e.target.checked)}
            />
            <span className="mr-2">
              أكمل التقييم العام
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={detailedSurveyCompleted}
              onChange={(e)=>setDetailedSurveyCompleted(e.target.checked)}
            />
            <span className="mr-2">
              أكمل الاستبيان التفصيلي
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(e)=>setShowOnHome(e.target.checked)}
            />
            <span className="mr-2">
              إظهار في الصفحة الرئيسية
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={showOnCourse}
              onChange={(e)=>setShowOnCourse(e.target.checked)}
            />
            <span className="mr-2">
              إظهار في صفحة الكورس
            </span>
          </label>

        </div>

        {message &&

          <div className="rounded-xl bg-emerald-50 p-4 font-bold text-emerald-700">

            {message}

          </div>

        }

        <div className="flex justify-end">

          <button

            onClick={saveSurvey}

            disabled={pending}

            className="inline-flex items-center gap-2 rounded-xl bg-[#F7B548] px-8 py-4 font-black"

          >

            <Save size={18}/>

            {pending
              ? "جاري الحفظ..."
              : "إضافة التقييم"}

          </button>

        </div>

      </div>

    </div>
  );
}