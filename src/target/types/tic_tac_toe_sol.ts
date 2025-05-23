/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tic_tac_toe_sol.json`.
 */
export type TicTacToeSol = {
  "address": "C18ERJ5zzEm5sanmVq5TELPg3KRe1ZB2Bsjf6GKNEaKx",
  "metadata": {
    "name": "ticTacToeSol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true,
          "signer": true
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "makeMove",
      "discriminator": [
        78,
        77,
        152,
        203,
        222,
        211,
        208,
        233
      ],
      "accounts": [
        {
          "name": "game",
          "writable": true
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "row",
          "type": "u8"
        },
        {
          "name": "col",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "game",
      "discriminator": [
        27,
        90,
        166,
        125,
        74,
        100,
        121,
        18
      ]
    }
  ],
  "events": [
    {
      "name": "gameDrawEvent",
      "discriminator": [
        4,
        47,
        130,
        192,
        72,
        88,
        1,
        14
      ]
    },
    {
      "name": "gameWonEvent",
      "discriminator": [
        77,
        254,
        183,
        239,
        55,
        127,
        221,
        120
      ]
    },
    {
      "name": "moveMadeEvent",
      "discriminator": [
        116,
        181,
        208,
        158,
        192,
        84,
        32,
        251
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "gameAlreadyEnded",
      "msg": "Game has already ended"
    },
    {
      "code": 6001,
      "name": "invalidMove",
      "msg": "Invalid move: out of bounds"
    },
    {
      "code": 6002,
      "name": "positionTaken",
      "msg": "Position already taken"
    },
    {
      "code": 6003,
      "name": "consecutiveMove",
      "msg": "Cannot make consecutive moves"
    }
  ],
  "types": [
    {
      "name": "game",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "board",
            "type": {
              "array": [
                {
                  "option": "pubkey"
                },
                9
              ]
            }
          },
          {
            "name": "lastPlayer",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "gameEnded",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "gameDrawEvent",
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "gameWonEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "winner",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "moveMadeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "row",
            "type": "u8"
          },
          {
            "name": "col",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
