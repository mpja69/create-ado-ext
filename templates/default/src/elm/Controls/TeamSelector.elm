module Controls.TeamSelector exposing
    ( Model
    , Msg(..)
    , TeamMini
    , init
    , update
    , view
    )

import Html exposing (Html)
import Html.Attributes as A
import Html.Events as E
import Icons exposing (boardIcon, checkmarkIcon, chevronDownIcon)
import Set exposing (Set)
import Svg.Attributes as Attr


type alias TeamMini =
    { id : String, name : String }


type alias Model =
    { selectedId : Maybe String
    , teams : List TeamMini
    , favorites : Set String -- favorite team names
    , query : String
    , dropdownOpen : Bool
    }


type Msg
    = ToggleDropdown
    | UpdateQuery String
    | SelectTeam String
    | ReplaceTeams (List TeamMini)
    | ReplaceFavorites (List String)


init : Maybe String -> Model
init selectedId =
    { selectedId = selectedId
    , teams = []
    , favorites = Set.empty
    , query = ""
    , dropdownOpen = False
    }


update : Msg -> Model -> ( Model, Maybe String )
update msg m =
    case msg of
        ReplaceTeams ts ->
            ( { m | teams = ts }, Nothing )

        ReplaceFavorites favNames ->
            ( { m | favorites = Set.fromList (List.map String.toLower favNames) }, Nothing )

        ToggleDropdown ->
            ( { m | dropdownOpen = not m.dropdownOpen, query = "" }, Nothing )

        UpdateQuery q ->
            ( { m | query = q }, Nothing )

        SelectTeam teamId ->
            ( { m | selectedId = Just teamId, dropdownOpen = False }, Just teamId )


view : Model -> Html Msg
view model =
    let
        selectedLabel =
            case model.selectedId of
                Just id_ ->
                    case List.filter (\t -> t.id == id_) model.teams |> List.head of
                        Just t ->
                            displayName t

                        Nothing ->
                            "Select team"

                Nothing ->
                    "Select team"

        dropdownContent =
            if model.dropdownOpen then
                [ Html.div
                    [ A.class "absolute top-full left-0 mt-1 w-[380px] bg-white shadow-lg rounded border border-gray-200 max-h-80 overflow-y-auto z-50" ]
                    (renderDropdown model)
                ]

            else
                []
    in
    Html.div [ A.class "w-full flex justify-start" ]
        [ Html.div [ A.class "relative z-50" ]
            (viewToggleButton selectedLabel model.dropdownOpen :: dropdownContent)
        ]


renderDropdown : Model -> List (Html Msg)
renderDropdown model =
    let
        q =
            String.toLower model.query

        matches t =
            String.contains q (String.toLower (displayName t))

        visible =
            List.filter matches model.teams

        ( favs, others ) =
            List.partition (\t -> isFavorite model.favorites (displayName t)) visible
    in
    renderSearchBar model.query
        :: renderSection "My favorite teams" model.favorites model.selectedId favs
        ++ renderSection "All teams" model.favorites model.selectedId others


renderSearchBar : String -> Html Msg
renderSearchBar query =
    Html.div
        [ A.class "sticky top-0 bg-white z-10 border-b border-gray-200 p-3" ]
        [ Html.input
            [ A.placeholder "Search for team"
            , A.value query
            , E.onInput UpdateQuery
            , A.class "w-full px-2 py-1 border border-gray-300 rounded"
            ]
            []
        ]


renderSection : String -> Set String -> Maybe String -> List { id : String, name : String } -> List (Html Msg)
renderSection title favs selectedId teams_ =
    if List.isEmpty teams_ then
        []

    else
        Html.div [ A.class "font-semibold text-gray-700 px-3 pt-3 pb-1" ] [ Html.text title ]
            :: List.map (renderItem favs selectedId) teams_


renderItem : Set String -> Maybe String -> { id : String, name : String } -> Html Msg
renderItem favs selectedId team =
    let
        selected =
            isSelected selectedId team

        star =
            if isFavorite favs (displayName team) then
                Html.span [ A.class "text-yellow-500 mr-2" ] [ Html.text "★" ]

            else
                Html.text ""
    in
    Html.div
        [ E.onClick (SelectTeam team.id)
        , A.class "px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
        , A.attribute "style"
            ("background-color:"
                ++ (if selected then
                        "#e6f2ff"

                    else
                        "white"
                   )
            )
        ]
        [ Html.div [ A.class "flex items-center justify-between" ]
            [ Html.span [ A.class "w-5 flex justify-left" ]
                [ if selected then
                    --Html.text "✔︎"
                    checkmarkIcon [ Attr.class "w-4 h-4" ]

                  else
                    Html.text ""
                ]
            , Html.span [ A.class "flex-1 ml-2" ] [ Html.text (displayName team) ]
            , star
            ]
        ]


viewToggleButton : String -> Bool -> Html Msg
viewToggleButton selectedLabel isOpen =
    Html.button
        [ A.class "inline-flex items-center gap-2 px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50"
        , E.onClick ToggleDropdown
        , A.attribute "aria-expanded"
            (if isOpen then
                "true"

             else
                "false"
            )
        ]
        [ boardIcon [ Attr.class "w-6 h-6" ]
        , Html.span [ A.class "w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-left font-semibold text-xs" ] [ Html.text selectedLabel ]
        , chevronDownIcon [ Attr.class "w-6 h-6" ]
        ]



-- HELPERS


isFavorite : Set String -> String -> Bool
isFavorite favs name =
    Set.member (String.toLower name) favs


displayName : { id : String, name : String } -> String
displayName t =
    t.name


isSelected : Maybe String -> { id : String, name : String } -> Bool
isSelected sel t =
    case sel of
        Just id_ ->
            id_ == t.id

        Nothing ->
            False
