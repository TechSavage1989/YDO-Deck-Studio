package updater

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

var versionRE = regexp.MustCompile(`^(\d+)\.(\d+)\.(\d+)(?:-alpha\.(\d+)-duelcore\.(\d+)-rc(\d+))?$`)

type versionParts struct {
	major, minor, patch, alpha, duel, rc int
	prerelease                           bool
}

func parseVersion(v string) (versionParts, error) {
	v = strings.TrimPrefix(strings.TrimSpace(v), "v")
	m := versionRE.FindStringSubmatch(v)
	if m == nil {
		return versionParts{}, fmt.Errorf("unsupported version %q", v)
	}
	nums := make([]int, 6)
	for i := 1; i < len(m); i++ {
		if m[i] == "" {
			continue
		}
		n, err := strconv.Atoi(m[i])
		if err != nil {
			return versionParts{}, err
		}
		nums[i-1] = n
	}
	return versionParts{major: nums[0], minor: nums[1], patch: nums[2], alpha: nums[3], duel: nums[4], rc: nums[5], prerelease: m[4] != ""}, nil
}

func CompareVersions(a, b string) (int, error) {
	av, err := parseVersion(a)
	if err != nil {
		return 0, err
	}
	bv, err := parseVersion(b)
	if err != nil {
		return 0, err
	}
	aa := []int{av.major, av.minor, av.patch}
	bb := []int{bv.major, bv.minor, bv.patch}
	for i := range aa {
		if aa[i] < bb[i] {
			return -1, nil
		}
		if aa[i] > bb[i] {
			return 1, nil
		}
	}
	if av.prerelease != bv.prerelease {
		if av.prerelease {
			return -1, nil
		}
		return 1, nil
	}
	if !av.prerelease {
		return 0, nil
	}
	aa = []int{av.alpha, av.duel, av.rc}
	bb = []int{bv.alpha, bv.duel, bv.rc}
	for i := range aa {
		if aa[i] < bb[i] {
			return -1, nil
		}
		if aa[i] > bb[i] {
			return 1, nil
		}
	}
	return 0, nil
}
