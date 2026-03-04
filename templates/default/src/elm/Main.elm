-- src/elm/Main.elm


port module Main exposing (main)

import Browser
import Controls.TeamSelector as TeamSelector
import Html exposing (Html, div, text)
import Html.Attributes as A
import Json.Decode as D



-- FLAGS


type alias Flags =
    { initialSelectedTeamId : Maybe String
    , appVersion : String
    }



-- PORTS (Elm -> TS)


port requestTeamCatalog : () -> Cmd msg


port selectedTeamChanged : String -> Cmd msg



-- PORTS (TS -> Elm)


port receiveTeamCatalog : (D.Value -> msg) -> Sub msg



-- NEW: TS tells Elm "all ports are wired, you may start requesting data now"


port appReady : (() -> msg) -> Sub msg



-- MODEL


type alias Model =
    { teamSelector : TeamSelector.Model
    , version : String
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { teamSelector = TeamSelector.init flags.initialSelectedTeamId
      , version = flags.appVersion
      }
      -- CHANGED:
      -- Vi gör INTE requestTeamCatalog här längre, annars riskerar vi race condition.
    , Cmd.none
    )



-- MSG


type Msg
    = TeamSelectorMsg TeamSelector.Msg
    | GotTeamCatalog D.Value
    | AppReady



-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        -- NEW:
        -- Första "kick"-en när TS säger att allt är redo.
        AppReady ->
            ( model
            , requestTeamCatalog ()
            )

        GotTeamCatalog value ->
            -- Exempel: vi förväntar oss { teams: [...], favorites: [...] }
            -- (Du har redan detta decode i ditt projekt, så behåll din befintliga variant om du har en.)
            let
                decodeTeamMini =
                    D.map2 (\id name -> { id = id, name = name })
                        (D.field "id" D.string)
                        (D.field "name" D.string)

                decodePayload =
                    D.map2 Tuple.pair
                        (D.field "teams" (D.list decodeTeamMini))
                        (D.field "favorites" (D.list D.string))
            in
            case D.decodeValue decodePayload value of
                Ok ( teams, favorites ) ->
                    let
                        ( ts1, _ ) =
                            TeamSelector.update (TeamSelector.ReplaceTeams teams) model.teamSelector

                        ( ts2, _ ) =
                            TeamSelector.update (TeamSelector.ReplaceFavorites favorites) ts1
                    in
                    ( { model | teamSelector = ts2 }, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        TeamSelectorMsg subMsg ->
            let
                ( ts, maybeSelectedTeamId ) =
                    TeamSelector.update subMsg model.teamSelector

                cmd =
                    case maybeSelectedTeamId of
                        Just teamId ->
                            -- Elm -> TS (spara i storage etc)
                            selectedTeamChanged teamId

                        Nothing ->
                            Cmd.none
            in
            ( { model | teamSelector = ts }, cmd )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ -- NEW: vänta på att TS säger "ready"
          appReady (\_ -> AppReady)
        , -- TS -> Elm: katalog + favorites
          receiveTeamCatalog GotTeamCatalog
        ]



-- VIEW


view : Model -> Html Msg
view model =
    div [ A.class "p-4" ]
        [ TeamSelector.view model.teamSelector |> Html.map TeamSelectorMsg
        , div [ A.class "mt-4 text-xs opacity-60" ]
            [ text ("Version " ++ model.version) ]
        ]


main : Program Flags Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }
