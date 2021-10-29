export enum ContinuationType {
    URL = "URL",
    Room = "Room",
    Event = "Event",
    AutoDiscussionRoom = "AutoDiscussionRoom",
    Item = "Item",
    Exhibition = "Exhibition",
    ShufflePeriod = "ShufflePeriod",
    Profile = "Profile",
    OwnProfile = "OwnProfile",
    NavigationView = "NavigationView",
    ConferenceLandingPage = "ConferenceLandingPage",
}

export enum NavigationView {
    LiveProgramRooms = "LiveProgramRooms",
    HappeningSoon = "HappeningSoon",
    Tags = "Tags",
    Exhibitions = "Exhibitions",
    Search = "Search",
    Schedule = "Schedule",
    SocialRooms = "SocialRooms",
    People = "People",
    ShufflePeriods = "ShufflePeriods",
    MyBackstages = "MyBackstages",
}

export type ContinuationTo =
    | {
          type: ContinuationType.URL;
          url: string;
          text: string;
      }
    | {
          type:
              | ContinuationType.Room
              | ContinuationType.Event
              | ContinuationType.Item
              | ContinuationType.Exhibition
              | ContinuationType.ShufflePeriod
              | ContinuationType.Profile;
          id: string;
      }
    | {
          type: ContinuationType.AutoDiscussionRoom;
          id: string | null;
      }
    | {
          type: ContinuationType.ConferenceLandingPage | ContinuationType.OwnProfile;
      }
    | {
          type: ContinuationType.NavigationView;
          view:
              | NavigationView.Exhibitions
              | NavigationView.HappeningSoon
              | NavigationView.LiveProgramRooms
              | NavigationView.MyBackstages
              | NavigationView.People
              | NavigationView.Schedule
              | NavigationView.ShufflePeriods
              | NavigationView.SocialRooms;
      }
    | {
          type: ContinuationType.NavigationView;
          view: NavigationView.Search;
          term: string;
      }
    | {
          type: ContinuationType.NavigationView;
          view: NavigationView.Tags;
          tagId: string | null;
      };

export type ExtendedContinuationTo =
    | ContinuationTo
    | {
          type: "function";
          f: () => void;
      };

export enum ContinuationDefaultFor {
    None = "None",
    All = "Everyone",
    Presenters = "Presenters",
    Chairs = "Chairs",
    Viewers = "Viewers",
}
