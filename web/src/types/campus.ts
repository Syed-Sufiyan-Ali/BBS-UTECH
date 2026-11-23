export type BuildingKey = 'OLD_BUILDING' | 'NEW_BUILDING' | 'CAMPUS_GROUNDS';

export type FloorKey = 'GROUND' | 'FIRST' | 'SECOND' | 'OUTDOOR';

export type PinCategoryKey =
  | 'ADMIN'
  | 'ACADEMIC'
  | 'LAB'
  | 'LIBRARY'
  | 'STUDENT_SERVICE'
  | 'AMENITY'
  | 'TRANSPORT_GATE';

export type AppTab = 'HOME' | 'OUTDOOR_MAP' | 'SCHEDULE' | 'BUSES';

export interface BuildingMeta {
  key: BuildingKey;
  displayName: string;
  shortName: string;
}

export interface FloorMeta {
  key: FloorKey;
  displayName: string;
  code: string;
  levelIndex: number;
}

export interface CampusPin {
  id: string;
  name: string;
  subTitle: string;
  building: BuildingKey;
  floor: FloorKey;
  category: PinCategoryKey;
  roomNumber: string;
  latitude: number;
  longitude: number;
  indoorX: number; // 0.0..1.0 on floor blueprint canvas
  indoorY: number; // 0.0..1.0 on floor blueprint canvas
  inCharge: string;
  timings: string;
  contact: string;
  description: string;
  indoorGuide: string;
  outdoorGuide: string;
  tags: string[];
  mapLabel: string;
}

export interface ClassScheduleItem {
  id: string;
  department: string;
  deptCode: string;
  semester: number;
  section: string;
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  subjectCode: string;
  subjectTitle: string;
  timeSlot: string;
  startMinutes: number;
  endMinutes: number;
  instructor: string;
  locationPinId: string;
  roomLabel: string;
  isLab?: boolean;
}

export interface AcademicResource {
  id: string;
  title: string;
  category: string;
  description: string;
  details: string;
  externalUrl?: string;
  actionText: string;
  tags: string[];
}

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phoneExt: string;
  officePinId: string;
  roomName: string;
  qualification: string;
}

export interface CampusNotice {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  isHighPriority?: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  isSimulated: boolean;
  label: string;
  accuracyMeters?: number;
}

export interface BusStopTiming {
  stopName: string;
  cityArea: string;
  morningPickup: string;
  note?: string;
}

export interface BusPointRoute {
  pointNumber: number;
  busTitle: string;
  busNumber: string;
  corridorSummary: string;
  citiesCovered: string[];
  morningStartTime: string;
  campusArrivalTime: string;
  afternoonDepartureTime: string;
  driverOrIncharge: string;
  contactPhone: string;
  stops: BusStopTiming[];
}

export interface LatLng {
  lat: number;
  lng: number;
}
