module Icons exposing (boardIcon, checkmarkIcon, chevronDownIcon, cogOutlineIcon, cogwheel, filterIcon, helpIcon)

import Svg exposing (..)
import Svg.Attributes as Attr


chevronDownIcon : List (Svg.Attribute msg) -> Svg msg
chevronDownIcon attrs =
    Svg.svg
        ([ --Attr.width "16"
           --, Attr.height "16"
           Attr.viewBox "0 0 16 16"
         , Attr.fill "none"
         , Attr.stroke "currentColor"
         , Attr.strokeWidth "1.5"
         , Attr.class "w-4 h-4"
         ]
            ++ attrs
        )
        [ Svg.polyline
            [ Attr.points "4,6 8,10 12,6"
            , Attr.strokeLinecap "round"
            , Attr.strokeLinejoin "round"
            ]
            []
        ]


filterIcon : List (Svg.Attribute msg) -> Svg msg
filterIcon attrs =
    Svg.svg
        ([ --     Attr.width "16"
           -- , Attr.height "16"
           Attr.viewBox "0 0 24 24"
         , Attr.fill "none"
         , Attr.stroke "currentColor"
         , Attr.strokeWidth "2"
         , Attr.class "w-4 h-4"
         ]
            ++ attrs
        )
        [ Svg.path [ Attr.d "M3 4h18M6 10h12M10 16h4" ] [] ]


boardIcon : List (Svg.Attribute msg) -> Svg msg
boardIcon attrs =
    Svg.svg
        ([ Attr.viewBox "0 0 24 24"

         -- , Attr.width "16"
         -- , Attr.height "16"
         , Attr.fill "none"
         , Attr.stroke "currentColor"
         , Attr.strokeWidth "1"
         , Attr.class "w-4 h-4"

         -- Lägg ev. till Attr.class "inline-block" om du vill
         ]
            ++ attrs
        )
        [ -- Översta rutan vänster (ljus)
          Svg.rect [ Attr.x "3", Attr.y "3", Attr.width "6", Attr.height "4", Attr.rx "1", Attr.fill "#666", Attr.stroke "#666" ] []
        , Svg.line [ Attr.x1 "4", Attr.y1 "5", Attr.x2 "8", Attr.y2 "5", Attr.stroke "#fff" ] []

        -- Mitten rutan vänster (mörk)
        , Svg.rect [ Attr.x "3", Attr.y "9", Attr.width "6", Attr.height "4", Attr.rx "1", Attr.fill "#000" ] []
        , Svg.line [ Attr.x1 "4", Attr.y1 "11", Attr.x2 "8", Attr.y2 "11", Attr.stroke "#fff" ] []

        -- Nedersta rutan vänster (mörk)
        , Svg.rect [ Attr.x "3", Attr.y "15", Attr.width "6", Attr.height "4", Attr.rx "1", Attr.fill "#000" ] []
        , Svg.line [ Attr.x1 "4", Attr.y1 "17", Attr.x2 "8", Attr.y2 "17", Attr.stroke "#fff" ] []

        -- Översta rutan höger (ljus)
        , Svg.rect [ Attr.x "11", Attr.y "3", Attr.width "6", Attr.height "4", Attr.rx "1", Attr.fill "#666", Attr.stroke "#666" ] []
        , Svg.line [ Attr.x1 "12", Attr.y1 "5", Attr.x2 "16", Attr.y2 "5", Attr.stroke "#fff" ] []

        -- Nedersta rutan höger (ljus)
        , Svg.rect [ Attr.x "11", Attr.y "9", Attr.width "6", Attr.height "4", Attr.rx "1", Attr.fill "#666", Attr.stroke "#666" ] []
        , Svg.line [ Attr.x1 "12", Attr.y1 "11", Attr.x2 "16", Attr.y2 "11", Attr.stroke "#fff" ] []
        ]


checkmarkIcon : List (Svg.Attribute msg) -> Svg msg
checkmarkIcon attrs =
    Svg.svg
        ([ --Attr.viewBox "0 0 16 16"
           --, Attr.width "16"
           Attr.height "16"
         , Attr.fill "none"
         , Attr.stroke "gray"
         , Attr.strokeWidth "2"
         , Attr.strokeLinecap "round"
         , Attr.strokeLinejoin "round"
         , Attr.class "w-4 h-4"
         ]
            ++ attrs
        )
        [ Svg.path [ Attr.d "M3 8l3 3 7-7" ] [] ]


cogwheel : List (Svg.Attribute msg) -> Svg msg
cogwheel attrs =
    Svg.svg
        ([ Attr.viewBox "0 0 340.274 340.274"
         , Attr.fill "currentColor"
         ]
            ++ attrs
        )
        [ Svg.path
            [ Attr.d "M293.629,127.806l-5.795-13.739c19.846-44.856,18.53-46.189,14.676-50.08l-25.353-24.77l-2.516-2.12h-2.937 c-1.549,0-6.173,0-44.712,17.48l-14.184-5.719c-18.332-45.444-20.212-45.444-25.58-45.444h-35.765 c-5.362,0-7.446-0.006-24.448,45.606l-14.123,5.734C86.848,43.757,71.574,38.19,67.452,38.19l-3.381,0.105L36.801,65.032 c-4.138,3.891-5.582,5.263,15.402,49.425l-5.774,13.691C0,146.097,0,147.838,0,153.33v35.068c0,5.501,0,7.44,46.585,24.127 l5.773,13.667c-19.843,44.832-18.51,46.178-14.655,50.032l25.353,24.8l2.522,2.168h2.951c1.525,0,6.092,0,44.685-17.516 l14.159,5.758c18.335,45.438,20.218,45.427,25.598,45.427h35.771c5.47,0,7.41,0,24.463-45.589l14.195-5.74 c26.014,11,41.253,16.585,45.349,16.585l3.404-0.096l27.479-26.901c3.909-3.945,5.278-5.309-15.589-49.288l5.734-13.702 c46.496-17.967,46.496-19.853,46.496-25.221v-35.029C340.268,146.361,340.268,144.434,293.629,127.806z M170.128,228.474 c-32.798,0-59.504-26.187-59.504-58.364c0-32.153,26.707-58.315,59.504-58.315c32.78,0,59.43,26.168,59.43,58.315 C229.552,202.287,202.902,228.474,170.128,228.474z"
            ]
            []
        ]


cogOutlineIcon : List (Svg.Attribute msg) -> Svg msg
cogOutlineIcon attrs =
    Svg.svg
        ([ Attr.viewBox "0 0 24 24"
         , Attr.fill "none"
         , Attr.stroke "currentColor"
         , Attr.strokeWidth "1.5"
         , Attr.class "w-5 h-5"
         ]
            ++ attrs
        )
        [ Svg.path
            [ Attr.strokeLinecap "round"
            , Attr.strokeLinejoin "round"
            , Attr.d
                "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            ]
            []
        , Svg.path
            [ Attr.strokeLinecap "round"
            , Attr.strokeLinejoin "round"
            , Attr.d "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            ]
            []
        ]


helpIcon : List (Svg.Attribute msg) -> Svg msg
helpIcon attrs =
    Svg.svg
        ([ Attr.viewBox "0 0 24 24"
         , Attr.fill "none"
         , Attr.stroke "currentColor"
         , Attr.strokeWidth "2"
         , Attr.strokeLinecap "round"
         , Attr.strokeLinejoin "round"
         ]
            ++ attrs
        )
        [ -- outer circle
          Svg.circle
            [ Attr.cx "12"
            , Attr.cy "12"
            , Attr.r "10"
            ]
            []

        -- question mark curve
        , Svg.path
            [ Attr.d "M9.1 9a3 3 0 1 1 5.6 1c-.6 1-1.7 1.4-2.3 2-.5.5-.5 1-.5 2"
            ]
            []

        -- dot
        , Svg.circle
            [ Attr.cx "12"
            , Attr.cy "17"
            , Attr.r "1"
            ]
            []
        ]
