import type { ComponentType, ReactNode, SVGProps } from "react";

/**
 * Single source of truth for UI icons. Replaces raw emoji glyphs with crisp,
 * recolourable, consistently-sized SVG — so icons respect the active palette
 * (teal medical theme) and render identically across platforms.
 *
 * Two entry points:
 *   - Named icon components (e.g. <HomeIcon className="h-5 w-5" />)
 *   - <EmojiIcon name="🫀" /> / <AvatarIcon emoji="🧑‍⚕️" /> for data-driven
 *     emoji that live in the database (categories, badges, leagues, avatars).
 */

/* ---------------------------------------------------------------- factory */
/** Compact factory for stroke-based icons. Sub-paths separated by "~". */
function mk(d: string) {
  function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        {d.split("~").map((p, i) => (
          <path key={i} d={p} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
    );
  }
  return Icon;
}

/* ------------------------------------------------------- existing icons */
export function StethoscopeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M14 6v12a8 8 0 0 0 16 0V6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="14" cy="6" r="2.5" fill="currentColor" />
      <circle cx="30" cy="6" r="2.5" fill="currentColor" />
      <path d="M30 18v4a10 10 0 0 1-20 0v-4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M10 22v3a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="38" cy="30" r="7" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="38" cy="30" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 6.5 12 13l8.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="8" r="3.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function EyeIcon({ open = true, ...props }: SVGProps<SVGSVGElement> & { open?: boolean }) {
  if (!open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c5 0 9 4 10 7-.4 1.1-1.3 2.6-2.6 3.9M6.6 6.6C4.5 8 3.1 10 2 12c1 3 5 7 10 7 1.3 0 2.5-.3 3.6-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.9 10a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M2 12c1-3 5-7 10-7s9 4 10 7c-1 3-5 7-10 7s-9-4-10-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.15" />
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ErrorCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.15" />
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="1.1" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------- nav / shell */
export const HomeIcon = mk("M3 10.5 12 3l9 7.5~M5 9.5V21h14V9.5~M9.5 21v-6h5v6");
export const TargetIcon = mk("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18~M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10~M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2");
export const TrophyIcon = mk("M8 21h8~M12 17v4~M7 4h10v5a5 5 0 0 1-10 0V4~M7 6H4a3 3 0 0 0 3 5~M17 6h3a3 3 0 0 1-3 5");
export const UsersIcon = mk("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2~M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8~M22 21v-2a4 4 0 0 0-3-3.87~M16 3.13a4 4 0 0 1 0 7.75");
export const GearIcon = mk("M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8~M12 2v2~M12 20v2~M4.9 4.9l1.4 1.4~M17.7 17.7l1.4 1.4~M2 12h2~M20 12h2~M4.9 19.1l1.4-1.4~M17.7 6.3l1.4-1.4");
export const WrenchIcon = mk("M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.6 12.4l-3-3 3.1-3.1z");
export const LogoutIcon = mk("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4~M16 17l5-5-5-5~M21 12H9");
export const BookIcon = mk("M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5~M4 19.5A2.5 2.5 0 0 1 6.5 17H20");
export const BookOpenIcon = mk("M2 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H2V4z~M22 4h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7V4z");
export const PartyIcon = mk("M4 14s1-5 6-8c3-2 7-2 9-1~M4 14l-1.5 6L8 18.5~M12 6l1 2.5L15.5 9 13 10.5 12 13l-1-2.5L8.5 9 11 8.5 12 6");
export const MedalIcon = mk("M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10~M8 21l1.5-4L12 18l2.5-1L16 21l-4-1.5L8 21");
export const RibbonIcon = mk("M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8~M12 8v7~M7 8 5 18l3-2 4 1 4-1 3 2-2-10");
export const IceIcon = mk("M12 2 4 7l8 5 8-5-8-5~M4 7v10l8 5 8-5V7~M12 12v10");
export const CheckIcon = mk("M5 12.5l5 5 9-11");
export const XIcon = mk("M6 6l12 12~M18 6 6 18");
export const SparklesIcon = mk("M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3~M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14");
export const FolderIcon = mk("M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z");
export const RepeatIcon = mk("M17 2l4 4-4 4~M3 11V9a4 4 0 0 1 4-4h14~M7 22l-4-4 4-4~M21 13v2a4 4 0 0 1-4 4H3");
export const BulbIcon = mk("M9 18h6~M10 21h4~M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.2 1.1 2.2h5c0-1 .4-1.7 1.1-2.2A6 6 0 0 0 12 3");
export const SadIcon = mk("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18~M8 10h.01~M16 10h.01~M8 15c1 1.5 2.5 2 4 2s3-.5 4-2");
export const SmileIcon = mk("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18~M8 10h.01~M16 10h.01~M8 14c1 2 2.5 3 4 3s3-1 4-3");
export const CoolIcon = mk("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18~M8 10h.01~M16 10h.01~M8 15l4-3 4 3");
export const HospitalIcon = mk("M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16~M3 21h18~M9 7v4~M7 9h4~M14 7v4~M12 9h4~M9 15v4~M7 17h4~M14 15v4~M12 17h4");
export const RobotIcon = mk("M12 2v2~M12 22v-2~M5 4h14v10a7 7 0 0 1-14 0V4~M8 8h8~M9 11h6~M5 4a3 3 0 0 0-3 3~M19 4a3 3 0 0 1 3 3");
export const MuscleIcon = mk("M18 5a3 3 0 0 1 3 3v2a3 3 0 0 1-2 2.83V14a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-2.83A3 3 0 0 1 9 8V5a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3z~M5 9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2~M19 9a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2");
export const RocketIcon = mk("M12 15c-1.5-1.5-3-4.5-3-8a3 3 0 0 1 6 0c0 3.5-1.5 6.5-3 8~M9 12c-2 1-4 1-6 0l2 5c2 1 4 1 6 0~M15 12c2 1 4 1 6 0l-2 5c-2 1-4 1-6 0~M12 15v4~M9 21c0-1 1.5-2 3-2s3 1 3 2");
export const LetterIcon = mk("M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z~M22 8l-10 6L2 8");
export const SwordsIcon = mk("M4 4l7 7~M20 4l-7 7~M13 13l7 7~M11 13l-7 7~M11 11l2 2");
export const PlusIcon = mk("M12 5v14~M5 12h14");
export const SearchIcon = mk("M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16~M21 21l-4.3-4.3");
export const SignalIcon = mk("M2 12h4l3 7 6-14 3 7h4");
export const InboxIcon = mk("M4 4h16v16H4z~M4 14h4l2 3h4l2-3h4");
export const BarChartIcon = mk("M4 4h16v16H4z~M8 16v-4~M12 16V8~M16 16v-6");
export const ChartIcon = mk("M3 3v18h18~M7 15l3-4 3 2 5-6");
export const WaveHandIcon = mk("M7 11V6a1.5 1.5 0 0 1 3 0v4~M10 9V4a1.5 1.5 0 0 1 3 0v5~M13 9V5a1.5 1.5 0 0 1 3 0v6~M16 11V7a1.5 1.5 0 0 1 3 0v7c0 4-2 6-6 6-3 0-5-1.5-6-4l-2-5a1.5 1.5 0 0 1 2.5-1.5L10 12");
export const FlagIcon = mk("M5 21V4~M5 4h12l-2 3 2 3H5");
export const MicroscopeIcon = mk("M6 21h12~M7 21v-3~M7 18h10~M10 3v11~M10 3c0 3 2 5 4 5~M14 8v6~M14 14c2 0 3 1 3 3v1");
export const VolcanoIcon = mk("M12 3 6 12l6 9 6-9-6-9z~M8 12h8~M9 9h6");
export const MonitorIcon = mk("M4 4h16v16H4z~M7 9v4~M5 11h4~M12 6v10~M10 12h4~M17 8v8~M15 12h4");
export const ClipboardIcon = mk("M9 4h6v2H9z~M9 4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2~M8 10h8~M8 14h5");
export const MemoIcon = mk("M5 3h11l3 3v15H5z~M16 3v3h3~M8 11h8~M8 15h5");
export const ChatIcon = mk("M21 12a8 8 0 0 1-8 8H5a2 2 0 0 1-2-2v-1a8 8 0 0 1 8-8h2a8 8 0 0 1 8 3z~M8 13h.01~M12 13h.01~M16 13h.01");
export const CalculatorIcon = mk("M5 3h14v18H5z~M8 7h8~M8 11h.01~M12 11h.01~M16 11h.01~M8 15h.01~M12 15h.01~M16 15h.01~M8 19h.01~M12 19h.01~M16 19h.01");
export const WindIcon = mk("M3 8h10a3 3 0 1 0-3-3~M3 12h16a3 3 0 1 1-3 3~M3 16h7a2 2 0 1 1-2 2");
export const DropletIcon = mk("M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z");
export const BloodDropIcon = DropletIcon;
export const RainIcon = mk("M7 14a4 4 0 0 1-.5-8A6 6 0 0 1 18 7a3.5 3.5 0 0 1-1 7H7~M8 18l-1 2~M12 18l-1 2~M16 18l-1 2");
export const SirenIcon = mk("M12 4a8 8 0 0 1 8 8v6h2~M12 4a8 8 0 0 0-8 8v6H2~M12 8v2~M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2~M9 17h.01~M15 17h.01");
export const AmbulanceIcon = mk("M5 6h11v9H5z~M16 9h3l2 3v3h-5~M5 15h16v2a2 2 0 0 1-2 2h-1~M4 20h1~M15 20h1~M7 9v3~M5.5 10.5h3~M9 17h.01~M18 17h.01");
export const SyringeIcon = mk("M18 6l-2-2~M19 3l2 2~M4 20l2 2 12-12~M6 10l8 8~M8 16l-4 4~M12 4l4 4");
export const PillIcon = mk("M10.5 20a6.5 6.5 0 0 1 0-13l3 3a6.5 6.5 0 0 1-3 10z~M13.5 4a6.5 6.5 0 0 1 0 13l-3-3a6.5 6.5 0 0 1 3-10z~M9 15l6-6");
export const VirusIcon = mk("M12 4v3~M12 17v3~M4 12h3~M17 12h3~M6 6l2 2~M16 16l2 2~M18 6l-2 2~M8 16l-2 2~M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5");
export const BabyIcon = mk("M9 12h.01~M15 12h.01~M12 7a4 4 0 0 0-4 4c0 4 2 6 4 8 2-2 4-4 4-8a4 4 0 0 0-4-4~M10 21v-3");
export const PregnantIcon = mk("M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4~M12 8c-3 0-5 2-5 5 0 4 3 6 4 8h2c1-2 4-4 4-8 0-3-2-5-5-5z");
export const BandageIcon = mk("M4 13l7-7 7 7-7 7-7-7z~M8 11h8~M11 8v8");
export const ButterflyIcon = mk("M12 5c-3-3-7-1-7 3 0 2 3 3 7 6 4-3 7-4 7-6 0-4-4-6-7-3z~M12 8v11~M7 8c-2 1-3 3-3 5 0 3 3 4 4 5 1-3 1-6-1-10~M17 8c2 1 3 3 3 5 0 3-3 4-4 5-1-3-1-6 1-10");
export const CandyIcon = mk("M5 12a7 7 0 0 1 14 0~M12 5v14~M5 12a3 3 0 0 0-3 3 3 3 0 0 0 3 3~M19 12a3 3 0 0 1 3 3 3 3 0 0 1-3 3~M5 12a3 3 0 0 1 3-3 3 3 0 0 1 3 3");
export const TeddyIcon = mk("M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4~M16 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4~M4 14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4~M12 12v2~M8 20v1~M16 20v1~M12 16v4");
export const FeatherIcon = mk("M20 4c-6 0-11 3-13 8l-2 8 8-2c5-2 8-7 8-13~M20 4c-3 3-5 6-5 10");
export const SeedlingIcon = mk("M12 21v-9~M12 12c-5-1-8-4-8-9 5 0 8 3 8 9z~M12 12c5-1 8-4 8-9-5 0-8 3-8 9z~M7 21h10");
export const ShieldIcon = mk("M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z~M8 12l3 3 5-6");
export const GraduationIcon = mk("M2 9l10-5 10 5-10 5L2 9z~M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5~M22 9v5");
export const BrainIcon = mk("M9.5 4A3 3 0 0 0 7 7c0 .6.2 1.1.5 1.5A3.5 3.5 0 0 0 5 12a3.5 3.5 0 0 0 2.5 3.3c-.3.4-.5 1-.5 1.7a3 3 0 0 0 5.5 1.5c.3.3.9.5 1.5.5s1.2-.2 1.5-.5a3 3 0 0 0 5.5-1.5c0-.7-.2-1.3-.5-1.7A3.5 3.5 0 0 0 19 12a3.5 3.5 0 0 0-2.5-3.5c.3-.4.5-.9.5-1.5a3 3 0 0 0-2.5-3A3 3 0 0 0 12 5c-.6 0-1.2.2-1.5.5-.3-.3-.9-.5-1.5-.5z~M12 8v5");
export const LungsIcon = mk("M12 3c0 3-3 4-4 6-1 2-1 4 0 5 1 1 2 0 3-2 1 1 2 3 1 4-1 1-3 1-4-1~M12 3c0 3 3 4 4 6 1 2 1 4 0 5-1 1-2 0-3-2-1 1-2 3-1 4 1 1 3 1 4-1~M12 3v4");
export const HeartOrganIcon = mk("M12 20s-6-4.5-6-9a3 3 0 0 1 5-2.2A3 3 0 0 1 18 11c0 4.5-6 9-6 9z~M6 12c0-2 1.5-3.5 3-4~M18 12c0-2-1.5-3.5-3-4~M9 20c1.5 0 2-2 3-2s1.5 2 3 2");
export const PulseIcon = mk("M3 12h3l2-5 3 9 2-6 1 2h7~M2 8h1M21 16h1");
export const TimerIcon = mk("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18~M12 7v5l3 3~M9 2h6");
export const BellIcon = mk("M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8~M10.3 21a2 2 0 0 0 3.4 0");
export const SpeakerIcon = mk("M11 5 6 9H3v6h3l5 4V5z~M15.5 8.5a5 5 0 0 1 0 7~M18.5 5.5a9 9 0 0 1 0 13");

/* ------------------------------------------------------- filled icons */
export function GemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7 4h10l3.5 5L12 21 3.5 9 7 4z" fill="currentColor" />
      <path d="M3.5 9h17M9 4l-3 5 6 12 6-12-3-5M12 21 9 9M12 21l3-9" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor" />
    </svg>
  );
}

export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2c1 4.5-4.5 5-4.5 10a4.5 4.5 0 0 0 9 0c0-3-1.6-5.1-3.4-6.3.6 2.2-1.2 3.3-2 4.3.4-3.5-.5-6-0.6-8z" fill="currentColor" />
    </svg>
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8L12 2z" fill="currentColor" />
    </svg>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 21C5.5 15.5 2.5 11.8 2.5 8.5A4.5 4.5 0 0 1 12 5a4.5 4.5 0 0 1 9.5 3.5C21.5 11.8 18.5 15.5 12 21z" fill="currentColor" />
    </svg>
  );
}

export function CrownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-1.8 12H4.8L3 7z" fill="currentColor" />
    </svg>
  );
}

export function HundredIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="900" fill="currentColor" stroke="none" fontFamily="inherit">100</text>
    </svg>
  );
}

/** League medal — tone picks the ribbon/circle colour. */
function Medal({ tone, ...props }: SVGProps<SVGSVGElement> & { tone: "bronze" | "silver" | "gold" }) {
  const c = { bronze: "#cd7f32", silver: "#9ca3af", gold: "#f59e0b" }[tone];
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="9" r="6" fill={c} />
      <circle cx="12" cy="9" r="3.4" fill="none" stroke="#00000022" strokeWidth="1.4" />
      <path d="M9 14.5 7 21l5-2.4L17 21l-2-6.5" fill={c} />
    </svg>
  );
}
export const BronzeMedalIcon = (p: SVGProps<SVGSVGElement>) => <Medal tone="bronze" {...p} />;
export const SilverMedalIcon = (p: SVGProps<SVGSVGElement>) => <Medal tone="silver" {...p} />;
export const GoldMedalIcon = (p: SVGProps<SVGSVGElement>) => <Medal tone="gold" {...p} />;

/* ------------------------------------------------------- avatars (filled) */
function Avatar({ d, extra, ...props }: SVGProps<SVGSVGElement> & { d: string; extra?: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d={d} fill="currentColor" />
      {extra}
    </svg>
  );
}
const person = "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5";
export const HealthWorkerIcon = (p: SVGProps<SVGSVGElement>) => (
  <Avatar {...p} d={person} extra={<path d="M10 9h4v2h2v4h-2v2h-4v-2H8v-4h2V9z" fill="#fff" />} />
);
export const HijabIcon = (p: SVGProps<SVGSVGElement>) => (
  <Avatar {...p} d="M4.5 20c0-4 3.4-6.5 7.5-6.5 1.2 0 2.3.2 3.3.6L16 18H4.5V20zM12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" extra={<circle cx="12" cy="6.5" r="2.2" fill="#fff" opacity="0.9" />} />
);
export const ScientistIcon = (p: SVGProps<SVGSVGElement>) => (
  <Avatar {...p} d={person} extra={<path d="M8 9h8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />} />
);
export const StudentIcon = (p: SVGProps<SVGSVGElement>) => (
  <Avatar {...p} d={person} extra={<path d="M3 5l4.5-2.5L12 5v8l-4.5 2.5L3 13V5z" fill="#fff" />} />
);
export const TeacherIcon = (p: SVGProps<SVGSVGElement>) => (
  <Avatar {...p} d={person} extra={<rect x="15" y="13" width="6" height="4" rx="0.6" fill="#fff" />} />
);
export const HeroIcon = (p: SVGProps<SVGSVGElement>) => (
  <Avatar {...p} d={person} extra={<path d="M12 4l2 1.5V3h-2v2.5L12 6z" fill="#fff" />} />
);
export const CatIcon = (p: SVGProps<SVGSVGElement>) => (
  <Avatar {...p} d="M12 4c-4 0-7 3-7 7v5a2 2 0 0 0 2 2h1v-4a4 4 0 0 1 8 0v4h1a2 2 0 0 0 2-2v-5c0-4-3-7-7-7z" extra={<><path d="M5 5l2 2M19 5l-2 2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /><path d="M12 12v2M10 12.5h.01M14 12.5h.01" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></>} />
);
export const FoxIcon = (p: SVGProps<SVGSVGElement>) => (
  <Avatar {...p} d="M12 3c-2.5 0-4 2-4 4v1L5 5v5l3-1c0 4 2 7 4 7s4-3 4-7l3 1V5l-3 3V7c0-2-1.5-4-4-4z" extra={<path d="M10 11h.01M14 11h.01" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />} />
);

/* ------------------------------------------------------- emoji lookup */
type IconC = ComponentType<SVGProps<SVGSVGElement>>;

const EMOJI: Record<string, IconC> = {
  "🏠": HomeIcon, "🎯": TargetIcon, "🏆": TrophyIcon, "🤝": UsersIcon, "💎": GemIcon,
  "👤": UserIcon, "🛠️": WrenchIcon, "⚙️": GearIcon, "🚪": LogoutIcon, "🩺": StethoscopeIcon,
  "⚡": BoltIcon, "🎉": PartyIcon, "📚": BookIcon, "💪": MuscleIcon, "🔥": FlameIcon,
  "🏅": MedalIcon, "🎖️": RibbonIcon, "🧊": IceIcon, "🗂️": FolderIcon, "🔁": RepeatIcon,
  "💡": BulbIcon, "😢": SadIcon, "😅": SmileIcon, "😎": CoolIcon, "🚀": RocketIcon,
  "💌": LetterIcon, "⚔️": SwordsIcon, "➕": PlusIcon, "🔒": LockIcon, "👑": CrownIcon,
  "🔍": SearchIcon, "📡": SignalIcon, "📥": InboxIcon, "📊": BarChartIcon, "👋": WaveHandIcon,
  "🏁": FlagIcon, "📘": BookOpenIcon, "🔬": MicroscopeIcon, "🤖": RobotIcon, "📈": ChartIcon,
  "✅": CheckIcon, "✗": XIcon, "✕": XIcon, "❌": XIcon, "✓": CheckIcon,
  "⭐": StarIcon, "🌟": StarIcon, "✨": SparklesIcon, "💯": HundredIcon, "🌋": VolcanoIcon,
  "🎓": GraduationIcon, "🫀": HeartOrganIcon, "🫁": LungsIcon, "🧠": BrainIcon,
  "🩸": BloodDropIcon, "🏥": HospitalIcon, "💉": SyringeIcon, "💊": PillIcon,
  "🦠": VirusIcon, "👶": BabyIcon, "🤰": PregnantIcon, "👼": BabyIcon, "💓": PulseIcon,
  "🩹": BandageIcon, "🧮": CalculatorIcon, "🦋": ButterflyIcon, "🍬": CandyIcon,
  "🧸": TeddyIcon, "🪶": FeatherIcon, "🌱": SeedlingIcon, "🛡️": ShieldIcon,
  "⏱️": TimerIcon, "⏱": TimerIcon,
  "🚨": SirenIcon, "🚑": AmbulanceIcon, "🌧️": RainIcon, "💬": ChatIcon,
  "📝": MemoIcon, "📋": ClipboardIcon, "🎛️": MonitorIcon, "🌬️": WindIcon,
  "💧": DropletIcon, "💙": HeartIcon, "🩷": HeartIcon, "❤️": HeartIcon,
  "🔔": BellIcon, "🔊": SpeakerIcon,
  "❤️🩹": BandageIcon, "🥇": GoldMedalIcon, "🥈": SilverMedalIcon, "🥉": BronzeMedalIcon,
};

const AVATARS: Record<string, IconC> = {
  "🧑⚕️": HealthWorkerIcon, "👩⚕️": HealthWorkerIcon, "👨⚕️": HealthWorkerIcon,
  "🧕": HijabIcon, "👩🔬": ScientistIcon, "👨🔬": ScientistIcon, "🧑🎓": StudentIcon,
  "👩🏫": TeacherIcon, "🦸♀️": HeroIcon, "🦸♂️": HeroIcon, "🐱": CatIcon, "🦊": FoxIcon,
  "🩺": StethoscopeIcon, "🤖": RobotIcon,
};

const strip = (s: string) => s.replace(/\uFE0F/g, "");
const EM = (() => { const o: Record<string, IconC> = {}; for (const k in EMOJI) o[strip(k)] = EMOJI[k]; return o; })();
const AV = (() => { const o: Record<string, IconC> = {}; for (const k in AVATARS) o[strip(k)] = AVATARS[k]; return o; })();

export function EmojiIcon({ name, fallback = StarIcon, ...props }: SVGProps<SVGSVGElement> & { name?: string | null; fallback?: IconC }) {
  const C = (name && EM[strip(name)]) || fallback;
  return <C {...props} />;
}

export function AvatarIcon({ emoji, ...props }: SVGProps<SVGSVGElement> & { emoji?: string | null }) {
  const C = (emoji && AV[strip(emoji)]) || UserIcon;
  return <C {...props} />;
}

export function LeagueIcon({ emoji, ...props }: SVGProps<SVGSVGElement> & { emoji?: string | null }) {
  const C = (emoji && EM[strip(emoji)]) || TrophyIcon;
  return <C {...props} />;
}
