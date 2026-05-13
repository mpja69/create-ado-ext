-- src/elm/Main.elm


port module Main exposing (main)

import Browser
import Controls.TeamSelector as TeamSelector
import Html exposing (Html, div, p, span, text)
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


port receiveAppError : (D.Value -> msg) -> Sub msg



-- TS -> Elm: all ports are wired, safe to start requesting data now


port appReady : (() -> msg) -> Sub msg



-- MODEL


type alias Model =
    { teamSelector : TeamSelector.Model
    , version : String
    , error : Maybe String
    }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { teamSelector = TeamSelector.init flags.initialSelectedTeamId
      , version = flags.appVersion
      , error = Nothing
      }
      -- requestTeamCatalog is deferred until appReady fires to avoid a race condition.
    , Cmd.none
    )



-- MSG


type Msg
    = TeamSelectorMsg TeamSelector.Msg
    | GotTeamCatalog D.Value
    | GotAppError D.Value
    | AppReady



-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        AppReady ->
            ( model
            , requestTeamCatalog ()
            )

        GotTeamCatalog value ->
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

        GotAppError value ->
            let
                message =
                    D.decodeValue (D.field "message" D.string) value
                        |> Result.withDefault "An unexpected error occurred."
            in
            ( { model | error = Just message }, Cmd.none )

        TeamSelectorMsg subMsg ->
            let
                ( ts, maybeSelectedTeamId ) =
                    TeamSelector.update subMsg model.teamSelector

                cmd =
                    case maybeSelectedTeamId of
                        Just teamId ->
                            selectedTeamChanged teamId

                        Nothing ->
                            Cmd.none
            in
            ( { model | teamSelector = ts }, cmd )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ appReady (\_ -> AppReady)
        , receiveTeamCatalog GotTeamCatalog
        , receiveAppError GotAppError
        ]



-- VIEW


view : Model -> Html Msg
view model =
    div [ A.class "p-4" ]
        [ case model.error of
            Just err ->
                div [ A.class "mb-4 p-4 rounded-lg bg-red-50 border border-red-200" ]
                    [ p [ A.class "text-sm font-semibold text-red-800" ] [ text "Something went wrong" ]
                    , p [ A.class "text-sm text-red-700 mt-1" ] [ text err ]
                    ]

            Nothing ->
                TeamSelector.view model.teamSelector |> Html.map TeamSelectorMsg
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
