package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"

	"github.com/labstack/echo"
	"github.com/sirupsen/logrus"
)

func main() {
	var socketPath string
	flag.StringVar(&socketPath, "socket", "/run/guest/volumes-service.sock", "Unix domain socket to listen on")
	flag.Parse()

	os.RemoveAll(socketPath)

	logrus.New().Infof("Starting listening on %s\n", socketPath)
	router := echo.New()
	router.HideBanner = true

	startURL := ""

	ln, err := listen(socketPath)
	if err != nil {
		log.Fatal(err)
	}
	router.Listener = ln

	router.POST("/compile", compile)

	log.Fatal(router.Start(startURL))
}

func listen(path string) (net.Listener, error) {
	return net.Listen("unix", path)
}

func compile(ctx echo.Context) error {
	var request compileRequest
	if err := ctx.Bind(&request); err != nil {
		return err
	}

	resp, err := http.PostForm("https://go.dev/_/compile?backend=", url.Values{
		"withVet": {""},
		"body":    {request.Code},
		"version": {"2"},
	})
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)

	fmt.Println(string(body))

	var response compileResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, response)
}

type compileRequest struct {
	Code string `json:"code"`
}

type compileResponse struct {
	Errors string
	Events []event
}

type event struct {
	Message string
	Kind    string
	Delay   int
}
