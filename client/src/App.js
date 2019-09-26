import React, { Component } from "react";
import "./App.css";

import SpotifyWebApi from "spotify-web-api-js";
const spotifyApi = new SpotifyWebApi();

function SavedSongs(props) {
  const songs = props.songs;

  //console.log(songs[0]).node.track;

  const listItems = songs.map((song, index) => (
    <div key={index}>
      <h2> {song.track.name}</h2>

      {song.track.album.artists.map((a, index) => (
        <p key={index}>{a.name}</p>
      ))}
      <div>
        {" "}
        <img
          alt={song.track.album.images[0].url}
          src={song.track.album.images[0].url}
          style={{ height: 150 }}
        />
      </div>

      <br />
    </div>
  ));
  return <ul>{listItems}</ul>;
}
class App extends Component {
  constructor() {
    super();
    const params = this.getHashParams();
    // this.SavedSongs = this.SavedSongs.bind(this);
    const token = params.access_token;

    if (token) {
      spotifyApi.setAccessToken(token);
    }
    this.state = {
      mainPlaylist: "",
      token: token,
      user: params.userID,
      savedSongs: [],
      songUris: [],
      loggedIn: token ? true : false,
      nowPlaying: { name: "Not Checked", albumArt: "" }
    };
    this.getSaved();
    this.getMainPlaylist();
    this.getNowPlaying();
    this.getRecentSong();
  }

  getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);

    e = r.exec(q);
    while (e) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
      e = r.exec(q);
    }
    return hashParams;
  }
  createPlaylist() {
    new Promise((resolve, reject) => {
      var songUris = this.state.savedSongs.map((value, index) => {
        return value.track.uri;
      });

      this.setState({ songUris: songUris });

      if (this.state.savedSongs != null) {
        resolve(songUris);
      } else {
        reject(Error("Error: No list of saved songs."));
      }
    })
      .then(result => {
        const body = {
          name: "Recently Saved",
          public: true,
          description:
            "A collection of your most recent songs! Keep your playlist fresh while still mixing it up! Go ahead, hit that shuffle button, I know you want to. (Brought to you by Ben Tysseling)"
        };
        return body;
      })
      .then(body => {
        var playlistID = spotifyApi
          .createPlaylist(this.state.user, body)
          .then(response => {
            this.setState({ mainPlaylist: response.id });

            return response.id;
          });
        return playlistID;
      })
      .then(
        result => {
          spotifyApi
            .addTracksToPlaylist(
              this.state.useruser,
              result,
              this.state.songUris
            )
            .then(response => {
              console.log(response);
            });
        },
        function(error) {
          console.log("ERROR Loading songs into playlist");
        }
      );
  }
  getMainPlaylist() {
    spotifyApi
      .getUserPlaylists({ limit: 50 })
      .then(response => {
        console.log("userplayists:");
        console.log(response);
        return response;
      })
      .then(list => {
        var song = list.items.find(playlist => {
          return playlist.name === "Recently Saved";
        });
        console.log("the Playlist");
        console.log(song);
        this.setState({ mainPlaylist: song.id });
        this.getMainPlaylistSongs(song.id);
      });
  }

  getSaved() {
    spotifyApi.getMySavedTracks({ limit: 30 }).then(response => {
      console.log("getting saved songs...");
      console.log(response.items[0]);
      const newSongs = response.items;
      console.log(typeof newSongs);
      console.log(newSongs);

      this.setState({
        savedSongs: newSongs
      });
    });
  }

  getNowPlaying() {
    spotifyApi
      .getMyCurrentPlaybackState()
      .then(response => {
        this.setState({
          nowPlaying: {
            name: response.item.name,
            albumArt: response.item.album.images[0].url
          }
        });
      })
      .catch(() =>
        this.setState({
          nowPlaying: {
            name: "ERROR: There is no song being played",
            albumArt: ""
          }
        })
      );
  }
  updateList() {
    console.log("main playlistID:");
    console.log(this.state.mainPlaylist);
    var songUris = this.state.savedSongs.map((value, index) => {
      return value.track.uri;
    });
    new Promise((resolve, reject) => {
      spotifyApi.removeTracksFromPlaylist(
        this.state.user,
        this.state.mainPlaylist,
        this.state.mainPlaylistSongs
      );

      resolve();
    }).then(() => {
      this.setState({ songUris: songUris });
      spotifyApi
        .addTracksToPlaylist(this.state.user, this.state.mainPlaylist, songUris)
        .then(response => {
          console.log(response);
        });
    });
  }
  getMainPlaylistSongs(id) {
    console.log("the id of the main playlists");
    console.log(id);
    spotifyApi
      .getPlaylistTracks(this.state.user, id)
      .then(response => {
        console.log("THe tracks of the main playlist");
        console.log(response);
        return response;
      })
      .then(songs => {
        var number = -1;
        var thesongs = songs.items.map(item => {
          //console.log(number);
          number++;
          console.log(
            "uri: spotify:track:" +
              item.track.id +
              ", positions:[" +
              number +
              "]"
          );
          return {
            uri: "spotify:track:" + item.track.id,

            positions: [number]
          };
        });

        console.log(thesongs);
        this.setState({
          mainPlaylistSongs: thesongs
        });
      });
  }
  getRecentSong() {
    spotifyApi
      .getMyRecentlyPlayedTracks()
      .then(response => {
        console.log("Recent songs!!!");
        console.log(response.items[0].track);
        return response;
      })
      .then(response => {
        this.setState({
          nowPlaying: response.items[0].track
        });
      });
  }
  render() {
    return (
      <body>
        <div className="App">
          <button
            className="button"
            onClick={() => (window.location.href = "http://localhost:8888")}
          >
            {" "}
            Login to Spotify{" "}
          </button>

          {this.state.loggedIn && (
            <div style={{display:"inline-block" }}>
              <div className="sidenav">
                <h2 style={{ color: "#f1f1f1" }}>
                  {this.state.nowPlaying.albumArt == undefined ? (
                    <p>
                      Most Recently Played:
                      <br />
                    </p>
                  ) : (
                    <p>
                      {" "}
                      Now Playing:
                      <br />
                    </p>
                  )}

                  {this.state.nowPlaying.name}
                </h2>{" "}
                <img
                  justify="centered"
                  alt={this.state.nowPlaying.albumArt}
                  src={
                    this.state.nowPlaying.albumArt == undefined
                      ? this.state.nowPlaying.album.images[0].url
                      : this.state.nowPlaying.albumArt
                  }
                  style={{
                    height: 200,
                    display: "block",
                    marginLeft: "auto",
                    marginRight: "auto"
                  }}
                />
              </div>
              <h1> Hey {this.state.user}!</h1>

              <button
                className="button"
                onClick={() => {
                  this.updateList();
                }}
              >
                Update Playlist!
              </button>

              <button
                className="button"
                onClick={() => {
                  new Promise((resolve, reject) => {
                    console.log(this.state.savedSongs);
                    if (this.state.savedSongs.toString === "[]") {
                      this.getSaved();
                    }
                    resolve();
                  }).then(result => {
                    this.createPlaylist();
                  });
                }}
              >
                Create Playlist!
              </button>
              <h3 style={{ color: "#f1f1f1" }}>
                {" "}
                <h2>Saved songs:</h2>{" "}
                {<SavedSongs songs={this.state.savedSongs} />}
              </h3>
            </div>
          )}
        </div>
      </body>
    );
  }
}

export default App;
