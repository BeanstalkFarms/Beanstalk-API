1. From this directory, run `./build.sh` to build the image.
2. In the parent directory, supply values in `.env` file, copying the example as necessary. The compose will pull from here at runtime, the environemnt variables are not built into the image.
3. Back in the docker directory, run `./start.sh` to start the server.

To stop, run `./stop.sh`.

When rebuilding new images, it is recommended to delete the old ones when they are no longer needed. You can do so with the following command: `docker rmi <image id>`. The image ids can be found from the `docker images` command.
