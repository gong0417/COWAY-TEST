import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";

/** 일반 사용자가 `/admin`에 접근했을 때 표시 */
export function AdminAccessDeniedPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-lg rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-8 py-10 text-center shadow-sm">
        <span
          className="material-symbols-outlined mb-4 inline-block text-5xl text-outline"
          aria-hidden
        >
          lock
        </span>
        <h1 className="text-xl font-bold tracking-tight text-on-surface">
          관리자 전용 영역입니다
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          현재 계정은 <strong className="text-on-surface">일반 사용자(user)</strong> 권한입니다.
          <br />
          데이터 마스터·업로드 등 관리 기능은{" "}
          <strong className="text-on-surface">관리자(admin)</strong> 계정으로 로그인한 경우에만
          이용할 수 있습니다.
        </p>
        <p className="mt-4 text-xs text-outline">
          권한이 필요하면 시스템 관리자에게 문의하세요.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </MainLayout>
  );
}
